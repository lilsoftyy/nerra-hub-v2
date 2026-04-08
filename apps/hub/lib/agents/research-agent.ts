import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
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

  const prompt = `Du er en research-agent for Nerra AS, et B2B-konsulentselskap som hjelper fasadevaskfirmaer med å ta i bruk droner (Drone Wash Academy).

Bruk nettsøk til å finne informasjon om følgende firma. Søk på firmanavnet, nettsiden deres, og relevante bransjedetaljer.

Firma vi skal undersøke:
- Firmanavn: ${company.name}
- Land: ${company.country}
${company.operational_area ? `- Operasjonsområde: ${company.operational_area}` : ''}
${company.website ? `- Nettside: ${company.website}` : ''}
${company.employee_count ? `- Ansatte: ${company.employee_count}` : ''}
${company.facade_team_size ? `- Fasadeteam: ${company.facade_team_size} personer` : ''}
${contactInfo ? `- Kontakter: ${contactInfo}` : ''}
${company.notes ? `- Notater: ${company.notes}` : ''}

Søk aktivt på internett etter informasjon om dette firmaet. Finn ut:
- Hva firmaet gjør og hvilke tjenester de tilbyr
- Størrelse, omsetning og markedsposisjon hvis tilgjengelig
- Om de driver med fasadevask, bygningsvedlikehold, eller relaterte tjenester
- Relevante nyheter eller prosjekter

Skriv deretter en research-rapport (på norsk bokmål, markdown-formatering) med disse seksjonene:

1. **Oppsummering** — hvem firmaet er og hva de gjør, basert på det du fant på nett
2. **Tjenester og kompetanse** — hva de tilbyr, hvilke markeder de opererer i
3. **Relevans for Nerra** — vurdering av om og hvordan dette firmaet er relevant for Nerra (som kunde, partner, eller annet)
4. **Drone-potensial** — hvis relevant: vurdering av hvor egnet de er for dronebasert fasadevask
5. **Anbefalinger** — konkrete neste steg for Nerra

Skill tydelig mellom det du har funnet på nett og dine egne vurderinger. Hvis du ikke finner noe om firmaet, si det eksplisitt.`;

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
  const content = message.content
    .filter((block) => block.type === 'text')
    .map((block) => 'text' in block ? block.text : '')
    .join('\n\n');

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

  return { document_id: docId };
}
