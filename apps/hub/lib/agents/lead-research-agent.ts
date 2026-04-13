import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { loadSkill } from '@/lib/agents/skill-loader';
import { cleanAgentContent, getAgentMemory } from '@/lib/agents/utils';
import { firecrawlSearch } from '@/lib/firecrawl/client';
import { v7 as uuidv7 } from 'uuid';

export interface LeadResearchResult {
  document_id: string | null;
  error?: string;
}

export async function runLeadResearchAgent(country: string): Promise<LeadResearchResult> {
  const supabase = await createClient();
  const anthropic = getAnthropicClient();

  // Hent eksisterende selskaper for å unngå duplikater
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('name, country')
    .is('deleted_at', null);

  const existingNames = (existingCompanies ?? [])
    .map((c) => c.name.toLowerCase());

  const skill = loadSkill('lead-research');
  const memory = await getAgentMemory(supabase, 'lead_research_agent');

  // Firecrawl: bred søk etter fasadevask-selskaper i landet
  let firecrawlData = '';
  try {
    const queries = [
      `fasadevask selskaper ${country}`,
      `facade cleaning companies ${country}`,
      `building maintenance exterior cleaning ${country}`,
    ];
    const results = await Promise.all(queries.map((q) => firecrawlSearch(q, 5)));
    firecrawlData = results.filter(Boolean).join('\n\n---\n\n');
  } catch {
    // Firecrawl er valgfritt
  }

  const prompt = `${skill}${memory}

---

${firecrawlData ? `## Data innhentet fra nettet (Firecrawl)\n\nHer er søkeresultater med fullt sideinnhold. Bruk denne dataen som hovedkilde:\n\n${firecrawlData}\n\n---\n\n` : ''}## Oppdrag

Utfør lead research i dette landet: **${country}**

Finn 5-15 selskaper som matcher målprofilen beskrevet over.

### Selskaper som allerede finnes i CRM (IKKE ta med disse):
${existingNames.length > 0 ? existingNames.map((n) => `- ${n}`).join('\n') : '(ingen)'}

## VIKTIG: Format og stil

1. Start med en kort oppsummering (2-3 setninger) om søket
2. Bruk den EKSAKTE strukturen beskrevet i skill-filen for hvert selskap
3. ALLTID norsk bokmål med korrekte æ, ø, å — OVERSETT ALLE tyske/engelske fagord til norsk:
   - "Fassadenreinigung" → "fasadevask"
   - "Gebäudereinigung" → "bygningsrengjøring"
   - "Glasreinigung" → "glassrengjøring"
   - "Facility Service" → "eiendomsservice"
   - Bruk ALDRI tyske, engelske eller andre fremmedspråklige ord i beskrivelsene
4. Sorter etter relevans (mest relevant først)
5. Finn reelle kontaktpersoner med e-post og LinkedIn — dette er det mest verdifulle
6. Ikke legg inn linjeskift mellom label og verdi. Skriv "**Ansatte:** 50+" ikke "**Ansatte:**\\n\\n50+"`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const { content, summary } = cleanAgentContent(message);

  if (!content) {
    return { document_id: null, error: 'Agenten genererte ingen tekst' };
  }

  const docId = uuidv7();
  const { error } = await supabase.from('documents').insert({
    id: docId,
    company_id: null,
    kind: 'lead_research',
    visibility: 'internal',
    title: `Lead Research: ${country}`,
    summary,
    content_markdown: content,
    language: 'no',
    generated_by_agent: 'lead_research_agent',
  });

  if (error) {
    return { document_id: null, error: error.message };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'agent',
    actor_name: 'lead_research_agent',
    action: 'document.created',
    entity_type: 'document',
    entity_id: docId,
    details: { kind: 'lead_research', country },
  });

  return { document_id: docId };
}
