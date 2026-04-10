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

  // Generer lærdom fra endringene
  if (doc.generated_by_agent && originalContent !== editedMarkdown) {
    try {
      await generateLearning(
        doc.generated_by_agent,
        originalContent ?? '',
        editedMarkdown,
        documentId,
        doc.company_id,
        supabase,
      );
    } catch {
      // Lærdom-generering er ikke kritisk — ignorer feil
    }
  }

  return { success: true };
}

export async function addLeadFromReport(data: {
  name: string;
  country: string;
  city?: string;
  website?: string;
  employeeCount?: number;
  services?: string;
  relevance?: string;
  contacts: Array<{
    name: string;
    role?: string;
    email?: string;
    linkedin?: string;
  }>;
}) {
  const supabase = await createClient();
  const companyId = uuidv7();

  const notes = [
    data.services ? `Tjenester: ${data.services}` : null,
    data.relevance ? `Relevans: ${data.relevance}` : null,
    data.city ? `By: ${data.city}` : null,
  ].filter(Boolean).join('\n');

  const { error: companyError } = await supabase.from('companies').insert({
    id: companyId,
    name: data.name,
    country: data.country,
    website: data.website || null,
    employee_count: data.employeeCount || null,
    notes: notes || null,
    phase: 'lead',
  });

  if (companyError) return { error: companyError.message };

  if (data.contacts.length > 0) {
    const contactInserts = data.contacts.map((c, i) => ({
      id: uuidv7(),
      company_id: companyId,
      full_name: c.name,
      email: c.email || null,
      role: c.role || null,
      is_primary: i === 0,
    }));
    await supabase.from('contacts').insert(contactInserts);
  }

  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'human',
    action: 'company.created_from_lead_research',
    entity_type: 'company',
    entity_id: companyId,
    company_id: companyId,
    details: {
      company: data.name,
      contacts: data.contacts.length,
    },
  });

  return { success: true, companyId };
}

async function generateLearning(
  agentName: string,
  original: string,
  edited: string,
  documentId: string,
  companyId: string | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const anthropic = getAnthropicClient();

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

    await supabase.from('agent_memory').insert(
      learnings.map((l) => ({
        id: uuidv7(),
        agent_name: agentName,
        category: l.category,
        learning: l.learning,
        source_document_id: documentId,
        company_id: companyId,
      }))
    );
  } catch {
    // Parse feil — ignorer
  }
}
