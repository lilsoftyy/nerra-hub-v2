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
 * Kunderesearch — dyp research på ett selskap.
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

  // Hent selskapsdata og kvalifiseringssvar parallelt
  const [companyResult, qualificationResult] = await Promise.all([
    supabase
      .from('companies')
      .select('*, contacts(*), customer_dwa_details(*)')
      .eq('id', companyId)
      .single(),
    supabase
      .from('qualification_form_responses')
      .select('responses')
      .eq('company_id', companyId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const company = companyResult.data;
  const qualificationData = qualificationResult.data;

  if (!company) {
    return { document_id: null, error: 'Kunde ikke funnet' };
  }

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

---

## OBLIGATORISK FORMAT (brudd på dette er feil)

Du SKAL skrive rapporten som et lesbart dokument for en forretningsperson. IKKE et datadump.

SPRÅK: Skriv ALLTID på norsk bokmål med korrekte æ, ø, å. Uansett hvilket språk kildene er på (dansk, svensk, tysk, engelsk) — du OVERSETTER alt til norsk bokmål. Aldri kopier dansk eller andre språk inn i rapporten. "virksomhed" → "virksomhet", "medarbejdere" → "medarbeidere", osv.

REGLER:
1. Start med "# ${company.name}" — ingenting før dette
2. Første avsnitt: 2-3 setninger som oppsummerer selskapet
3. Bruk ## for hovedseksjoner, ### for underseksjoner
4. Skriv i HELE SETNINGER og AVSNITT — IKKE bare punktlister overalt
5. Punktlister KUN for kontaktinfo og konkrete handlingspunkter
6. Maks 5 hovedseksjoner, maks 1000 ord totalt
7. Norsk bokmål, profesjonell men vennlig tone — ALDRI dansk, svensk eller engelsk
8. INGEN kildehenvisninger, fotnoter eller referanser
9. INGEN tekniske detaljer som org.nr., stammkapital, eierstruktur-detaljer
10. Tenk: "Hva trenger Magnus å vite før han ringer denne personen?"

Seksjonene skal være:
## Om selskapet (2-3 avsnitt)
## Nøkkelpersoner (kort om hver person)
## Relevans for Nerra (2-3 setninger)
## Neste steg (2-3 konkrete handlinger)
## Landspesifikk info (kun hvis potensiell kunde — droneregulering, klima, lokale ressurser)

START NÅ med "# ${company.name}".`;


  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
