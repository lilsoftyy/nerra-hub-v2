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

  const prompt = `Du er en research-agent for Nerra AS, et B2B-konsulentselskap som hjelper fasadevaskfirmaer med å ta i bruk droner.

Generer en research-rapport (på norsk bokmål) for følgende firma:

Firmanavn: ${company.name}
Land: ${company.country}
${company.operational_area ? `Operasjonsområde: ${company.operational_area}` : ''}
${company.website ? `Nettside: ${company.website}` : ''}
${company.employee_count ? `Ansatte: ${company.employee_count}` : ''}
${company.facade_team_size ? `Fasadeteam: ${company.facade_team_size} personer` : ''}
${contactInfo ? `Kontakter: ${contactInfo}` : ''}
${company.notes ? `Notater: ${company.notes}` : ''}

Rapporten skal inneholde:
1. **Oppsummering** — kort om firmaet og deres potensial som DWA-kunde
2. **Markedsposisjon** — hva vi vet om deres posisjon i fasadevaskmarkedet
3. **Drone-potensial** — vurdering av hvor egnet de er for dronebasert fasadevask
4. **Anbefalinger** — konkrete neste steg for Nerra

Hold deg til det du faktisk vet fra dataene over. Ikke finn opp fakta. Hvis du mangler informasjon, si det eksplisitt. Bruk markdown-formatering.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const firstBlock = message.content[0];
  const content = firstBlock?.type === 'text' ? firstBlock.text : '';

  // Generate summary (first paragraph)
  const summary = content.split('\n\n')[0]?.replace(/[#*]/g, '').trim().slice(0, 200) ?? '';

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
