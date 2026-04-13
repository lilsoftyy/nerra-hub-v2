import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { notifyResearchComplete } from '@/lib/slack/notifications';
import { loadSkill } from '@/lib/agents/skill-loader';
import { cleanAgentContent, getAgentMemory } from '@/lib/agents/utils';
import { firecrawlSearch } from '@/lib/firecrawl/client';
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
  const memory = await getAgentMemory(supabase, 'agent_6_lead_research');

  // Firecrawl: hent data fra nettet før Claude analyserer
  let firecrawlData = '';
  try {
    const searchQuery = `${company.name} ${company.country} fasadevask facade cleaning`;
    firecrawlData = await firecrawlSearch(searchQuery, 5);
  } catch {
    // Firecrawl er valgfritt — fortsett uten hvis det feiler
  }

  const prompt = `${skill}${memory}

---

${firecrawlData ? `## Forhåndsinnhentet data fra nettet\n\n${firecrawlData}\n\n---\n\n` : ''}## Oppdrag

Utfør research på dette firmaet:

- Firmanavn: ${company.name}
- Land: ${company.country}
${company.operational_area ? `- Operasjonsområde: ${company.operational_area}` : ''}
${company.website ? `- Nettside: ${company.website}` : ''}
${company.employee_count ? `- Ansatte: ${company.employee_count}` : ''}
${company.facade_team_size ? `- Fasadeteam: ${company.facade_team_size} personer` : ''}
${contactInfo ? `- Kontakter: ${contactInfo}` : ''}
${company.notes ? `- Notater: ${company.notes}` : ''}

## Søkestrategi

1. Søk etter selskapets nettside og generell info
2. For norske selskaper: søk i Brønnøysundregisteret (proff.no eller brreg.no) for org.nr og offisielle data
3. For andre land: søk i tilsvarende selskapsregister
4. Søk etter nøkkelpersoner på LinkedIn

## VIKTIG: Format og stil

Skriv en KORT, LESBAR rapport for en forretningsperson.

Regler:
1. Start med "# ${company.name}" som hovedtittel
2. Første avsnitt: 2-3 setninger som oppsummerer hvem selskapet er
3. Maksimalt 3-4 korte seksjoner, under 500 ord totalt
4. Skriv i hele setninger, IKKE bare punktlister
5. ALLTID norsk bokmål med korrekte æ, ø, å — uansett hvilket språk kildene er på. Oversett dansk/svensk/engelsk til norsk
6. IKKE inkluder regulatorisk info, kilder eller tekniske detaljer
7. Fokus: hvem er de, hva gjør de, og er de relevante for Nerra?

## VIKTIG: Strukturerte data

Etter rapporten, legg til en blokk med strukturerte data som starter med "---METADATA---" på en egen linje, fulgt av JSON:

\`\`\`
---METADATA---
{"website":"https://example.com","org_number":"123456789","employee_count":500,"operational_area":"Norge"}
\`\`\`

Inkluder KUN felter du faktisk fant. Ikke gjett.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const { content: rawContent, summary } = cleanAgentContent(message);

  if (!rawContent) {
    return { document_id: null, error: 'Agenten genererte ingen tekst' };
  }

  // Parse metadata og oppdater firma
  let content = rawContent;
  const metadataMatch = rawContent.match(/---METADATA---\s*\n?\s*(\{[\s\S]*?\})/);
  if (metadataMatch) {
    content = rawContent.replace(/---METADATA---[\s\S]*$/, '').trim();
    try {
      const meta = JSON.parse(metadataMatch[1]!) as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      if (meta.website && !company.website) updateData.website = meta.website;
      if (meta.org_number && !company.org_number) updateData.org_number = meta.org_number;
      if (meta.employee_count && !company.employee_count) updateData.employee_count = meta.employee_count;
      if (meta.operational_area && !company.operational_area) updateData.operational_area = meta.operational_area;
      if (Object.keys(updateData).length > 0) {
        await supabase.from('companies').update(updateData).eq('id', companyId);
      }
    } catch {
      // Metadata-parsing feilet — ignorer
    }
  }

  // Save document
  const docId = uuidv7();
  const { error } = await supabase.from('documents').insert({
    id: docId,
    company_id: companyId,
    kind: 'research',
    visibility: 'internal',
    title: `Firmasøk: ${company.name}`,
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
