import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { v7 as uuidv7 } from 'uuid';
import { PHASES } from '@/lib/constants';

export interface AgentResult {
  proposals_created: number;
  details: string[];
}

export async function runProjectAgent(): Promise<AgentResult> {
  const supabase = await createClient();
  const result: AgentResult = { proposals_created: 0, details: [] };

  // Get all active companies (not finished, not deleted)
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, phase')
    .is('deleted_at', null)
    .neq('phase', 'finished');

  if (!companies || companies.length === 0) {
    result.details.push('Ingen aktive kunder å vurdere.');
    return result;
  }

  for (const company of companies) {
    // Get checklist items for current phase
    const { data: items } = await supabase
      .from('phase_checklist_items')
      .select('*')
      .eq('company_id', company.id)
      .eq('phase', company.phase);

    if (!items || items.length === 0) continue;

    const completedCount = items.filter((i) => i.completed).length;
    const totalCount = items.length;
    const allCompleted = completedCount === totalCount;

    // If all checklist items are completed, propose phase transition
    if (allCompleted) {
      const currentIndex = (PHASES as readonly string[]).indexOf(company.phase);
      const nextPhase = currentIndex < PHASES.length - 1 ? PHASES[currentIndex + 1] : null;

      if (!nextPhase) continue;

      // Check if there's already a pending proposal for this transition
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('company_id', company.id)
        .eq('action_type', 'phase_transition')
        .eq('status', 'pending_approval')
        .limit(1);

      if (existingProposal && existingProposal.length > 0) {
        result.details.push(`${company.name}: Har allerede et ventende forslag.`);
        continue;
      }

      // Use Claude to generate a description for the proposal
      const anthropic = getAnthropicClient();
      const phaseLabels: Record<string, string> = {
        lead: 'Lead', qualification: 'Kvalifisering', sales: 'Salg',
        onboarding: 'Onboarding', training: 'Opplæring', operational: 'Operativ', finished: 'Ferdig',
      };

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Du er en prosjektstyringsagent for Nerra AS (drone wash consulting). Kunden "${company.name}" har fullført alle sjekkpunkter i fasen "${phaseLabels[company.phase]}". Skriv en kort begrunnelse (1-2 setninger, norsk bokmål) for hvorfor kunden bør flyttes til neste fase "${phaseLabels[nextPhase]}". Vær konkret og profesjonell.`,
        }],
      });

      const firstBlock = message.content[0];
      const description = firstBlock?.type === 'text' ? firstBlock.text : '';

      // Create the proposal
      const { error } = await supabase.from('proposals').insert({
        id: uuidv7(),
        agent_name: 'agent_3_project',
        action_type: 'phase_transition',
        title: `Flytt ${company.name} til ${phaseLabels[nextPhase]}`,
        description,
        payload: {
          company_id: company.id,
          from_phase: company.phase,
          to_phase: nextPhase,
          trigger: 'checklist_completed',
        },
        company_id: company.id,
        reversible: true,
      });

      if (!error) {
        result.proposals_created++;
        result.details.push(`${company.name}: Foreslår overgang til ${phaseLabels[nextPhase]}.`);
      } else {
        result.details.push(`${company.name}: Feil ved opprettelse av forslag — ${error.message}`);
      }
    } else {
      result.details.push(`${company.name}: ${completedCount}/${totalCount} sjekkpunkter fullført.`);
    }
  }

  return result;
}
