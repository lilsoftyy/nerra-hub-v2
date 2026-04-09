import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { notifyResearchComplete } from '@/lib/slack/notifications';
import { loadSkill } from '@/lib/agents/skill-loader';
import { v7 as uuidv7 } from 'uuid';

export interface ResearchResult {
  document_id: string | null;
  error?: string;
}

export async function runResearchAgent(companyId: string): Promise<ResearchResult> {
  const supabase = await createClient();

  // Fetch company data
  const { data: company } = await supabase
    .from('companies')
    .select('*, contacts(*)')
    .eq('id', companyId)
    .single();

  if (!company) {
    return { document_id: null, error: 'Kunde ikke funnet' };
  }

  // Delete existing research documents so a fresh one can be generated
  await supabase
    .from('documents')
    .delete()
    .eq('company_id', companyId)
    .eq('kind', 'research');

  const anthropic = getAnthropicClient();

  const contacts = company.contacts as Array<{ full_name: string; role?: string; email?: string }> ?? [];
  const contactInfo = contacts.map((c) => `${c.full_name}${c.role ? ` (${c.role})` : ''}`).join(', ');

  const skill = loadSkill('research');

  const prompt = `${skill}

---

## Oppdrag

Utfør research på dette firmaet:

- Firmanavn: ${company.name}
- Land: ${company.country}
${company.operational_area ? `- Operasjonsområde: ${company.operational_area}` : ''}
${company.website ? `- Nettside: ${company.website}` : ''}
${company.employee_count ? `- Ansatte: ${company.employee_count}` : ''}
${company.facade_team_size ? `- Fasadeteam: ${company.facade_team_size} personer` : ''}
${contactInfo ? `- Kontakter: ${contactInfo}` : ''}
${company.notes ? `- Notater: ${company.notes}` : ''}

Start direkte med "# Research: ${company.name}" og følg instruksjonene i skillen over.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 10,
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text from the response (may contain multiple blocks due to tool use)
  // Filter out citation markers (small squares/dots from web search references)
  const rawContent = message.content
    .filter((block) => block.type === 'text')
    .map((block) => 'text' in block ? block.text : '')
    .join('\n\n');

  // Remove citation markers like [1], [2], etc. and unicode citation characters
  const content = rawContent
    .replace(/\[\d+\]/g, '')
    .replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, '')
    .replace(/\u200B/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!content) {
    return { document_id: null, error: 'Agenten genererte ingen tekst' };
  }

  // Generate summary (first meaningful paragraph)
  const summary = content
    .split('\n\n')
    .find((p) => p.length > 20)
    ?.replace(/[#*]/g, '')
    .trim()
    .slice(0, 200) ?? '';

  // Save document
  const docId = uuidv7();
  const { error } = await supabase.from('documents').insert({
    id: docId,
    company_id: companyId,
    kind: 'research',
    visibility: 'internal',
    title: `Research: ${company.name}`,
    summary,
    content_markdown: content,
    language: 'no',
    generated_by_agent: 'agent_6_lead_research',
  });

  if (error) {
    return { document_id: null, error: error.message };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'agent',
    actor_name: 'agent_6_lead_research',
    action: 'document.created',
    entity_type: 'document',
    entity_id: docId,
    company_id: companyId,
    details: { kind: 'research', title: `Research: ${company.name}` },
  });

  // Notify Slack (non-blocking)
  try {
    await notifyResearchComplete(company.name, companyId);
  } catch {
    // Non-blocking
  }

  return { document_id: docId };
}
