import { getAnthropicClient } from '@/lib/ai/anthropic';
import { notifyResearchComplete } from '@/lib/slack/notifications';
import { loadSkill } from '@/lib/agents/skill-loader';
import { cleanAgentContent, getAgentMemory } from '@/lib/agents/utils';
import { v7 as uuidv7 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CustomerResearchResult {
  document_id: string | null;
  error?: string;
}

/**
 * Kunderesearch-agent — dyp research på ett selskap.
 *
 * Trigges automatisk etter kvalifiseringsskjema, eller manuelt fra kundeprofil.
 * Bruker web search for å finne informasjon om selskapet, regulatorisk kontekst,
 * konkurrenter, og lokal markedssituasjon.
 */
export async function runCustomerResearchAgent(
  companyId: string,
  supabase: SupabaseClient,
  options?: { isAutoTriggered?: boolean }
): Promise<CustomerResearchResult> {

  // Hent selskapsdata med kontakter, DWA-detaljer og kvalifiseringssvar
  const { data: company } = await supabase
    .from('companies')
    .select('*, contacts(*), customer_dwa_details(*)')
    .eq('id', companyId)
    .single();

  if (!company) {
    return { document_id: null, error: 'Kunde ikke funnet' };
  }

  // Hent kvalifiseringssvar hvis det finnes
  const { data: qualificationData } = await supabase
    .from('qualification_form_responses')
    .select('responses')
    .eq('company_id', companyId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  // Slett eksisterende customer_report slik at vi genererer en ny
  await supabase
    .from('documents')
    .delete()
    .eq('company_id', companyId)
    .eq('kind', 'customer_report');

  const anthropic = getAnthropicClient();
  const skill = loadSkill('customer-research');

  const contacts = company.contacts as Array<{ full_name: string; role?: string; email?: string }> ?? [];
  const contactInfo = contacts.map((c) => `${c.full_name}${c.role ? ` (${c.role})` : ''}${c.email ? ` <${c.email}>` : ''}`).join('\n  - ');

  const dwa = (company.customer_dwa_details as Array<{
    existing_drone_experience?: string;
    target_start_date?: string;
    pilots_to_train?: number;
  }>)?.[0];

  const qualification = qualificationData?.responses as Record<string, string> | null;

  const memory = await getAgentMemory(supabase, 'customer_research_agent');

  const prompt = `${skill}${memory}

---

## Oppdrag

Gjennomfør dyp kunderesearch på dette selskapet${options?.isAutoTriggered ? ' (automatisk trigger etter kvalifiseringsskjema)' : ' (manuell trigger)'}:

### Firmainformasjon
- Firmanavn: ${company.name}
- Land: ${company.country}
${company.operational_area ? `- Operasjonsområde: ${company.operational_area}` : ''}
${company.website ? `- Nettside: ${company.website}` : ''}
${company.employee_count ? `- Ansatte: ${company.employee_count}` : ''}
${company.facade_team_size ? `- Fasadeteam: ${company.facade_team_size} personer` : ''}
${contactInfo ? `- Kontakter:\n  - ${contactInfo}` : ''}

${dwa ? `### DWA-detaljer
${dwa.existing_drone_experience ? `- Droneerfaring: ${dwa.existing_drone_experience}` : '- Ingen droneerfaring oppgitt'}
${dwa.target_start_date ? `- Ønsket oppstart: ${dwa.target_start_date}` : ''}
${dwa.pilots_to_train ? `- Piloter å lære opp: ${dwa.pilots_to_train}` : ''}` : ''}

${qualification ? `### Kvalifiseringssvar
- Bygningstyper: ${qualification.building_types ?? 'ikke oppgitt'}
- Nåværende metoder: ${qualification.current_methods ?? 'ikke oppgitt'}
- Droneerfaring: ${qualification.drone_experience ?? 'ikke oppgitt'}
- Ønsket oppstart: ${qualification.desired_start_date ?? 'ikke oppgitt'}
${qualification.additional_info ? `- Tilleggsinformasjon: ${qualification.additional_info}` : ''}` : ''}

Start direkte med "# Kunderesearch: ${company.name}" og følg instruksjonene i skillen over.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 15,
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  const { content, summary } = cleanAgentContent(message);

  if (!content) {
    return { document_id: null, error: 'Agenten genererte ingen tekst' };
  }

  // Lagre dokument
  const docId = uuidv7();
  const { error } = await supabase.from('documents').insert({
    id: docId,
    company_id: companyId,
    kind: 'customer_report',
    visibility: 'internal',
    title: `Kunderesearch: ${company.name}`,
    summary,
    content_markdown: content,
    language: 'no',
    generated_by_agent: 'customer_research_agent',
  });

  if (error) {
    return { document_id: null, error: error.message };
  }

  // Logg aktivitet
  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'agent',
    actor_name: 'customer_research_agent',
    action: 'document.created',
    entity_type: 'document',
    entity_id: docId,
    company_id: companyId,
    details: {
      kind: 'customer_report',
      title: `Kunderesearch: ${company.name}`,
      auto_triggered: options?.isAutoTriggered ?? false,
    },
  });

  // Slack-varsling
  try {
    await notifyResearchComplete(company.name, companyId);
  } catch {
    // Non-blocking
  }

  return { document_id: docId };
}
