'use server';

import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { v7 as uuidv7 } from 'uuid';
import { redirect } from 'next/navigation';

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) return { error: error.message };
  redirect('/documents');
}

export async function saveDocumentEdit(documentId: string, editedMarkdown: string) {
  const supabase = await createClient();

  // Hent originalen
  const { data: doc } = await supabase
    .from('documents')
    .select('content_markdown, original_markdown, generated_by_agent, company_id')
    .eq('id', documentId)
    .single();

  if (!doc) return { error: 'Dokument ikke funnet' };

  const originalContent = doc.original_markdown ?? doc.content_markdown;

  // Lagre original hvis første redigering
  const updateData: Record<string, unknown> = {
    content_markdown: editedMarkdown,
    edited_at: new Date().toISOString(),
    edited_by: 'human',
  };

  if (!doc.original_markdown) {
    updateData.original_markdown = doc.content_markdown;
  }

  const { error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) return { error: error.message };

  // Generer lærdom fra endringene (non-blocking)
  if (doc.generated_by_agent && originalContent !== editedMarkdown) {
    generateLearning(
      doc.generated_by_agent,
      originalContent ?? '',
      editedMarkdown,
      documentId,
      doc.company_id,
    ).catch(() => {});
  }

  return { success: true };
}

async function generateLearning(
  agentName: string,
  original: string,
  edited: string,
  documentId: string,
  companyId: string | null,
) {
  const anthropic = getAnthropicClient();
  const supabase = await createClient();

  // Begrens lengde for å spare tokens
  const origShort = original.slice(0, 3000);
  const editShort = edited.slice(0, 3000);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `En bruker redigerte et AI-generert dokument. Analyser endringene og trekk ut lærdom.

ORIGINAL (utdrag):
${origShort}

REDIGERT (utdrag):
${editShort}

Returner 1-3 konkrete lærdommer i JSON-array format. Hver lærdom har:
- "category": en av "tone", "content", "structure", "preference"
- "learning": en kort, konkret setning om hva brukeren foretrekker

Eksempler:
[
  {"category": "tone", "learning": "Brukeren foretrekker kortere, mer direkte setninger uten akademisk språk"},
  {"category": "content", "learning": "Brukeren fjernet finansielle detaljer — hold fokus på operasjonell info"}
]

Returner KUN JSON-array. Ingen forklaring.`,
    }],
  });

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => 'text' in b ? b.text : '')
    .join('');

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return;

  try {
    const learnings = JSON.parse(jsonMatch[0]) as Array<{ category: string; learning: string }>;

    for (const l of learnings) {
      await supabase.from('agent_memory').insert({
        id: uuidv7(),
        agent_name: agentName,
        category: l.category,
        learning: l.learning,
        source_document_id: documentId,
        company_id: companyId,
      });
    }
  } catch {
    // Parse feil — ignorer
  }
}
