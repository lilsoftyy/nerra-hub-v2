import { createClient } from '@/lib/supabase/server';
import type { ExecutionContext, ExecutionResult } from '../types';
import { ExecutionError } from '../types';

const PHASES = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];

export async function executePhaseTransition(
  payload: { company_id: string; from_phase: string; to_phase: string },
  _ctx: ExecutionContext,
): Promise<ExecutionResult> {
  const supabase = await createClient();

  // Validate transition
  const fromIdx = PHASES.indexOf(payload.from_phase);
  const toIdx = PHASES.indexOf(payload.to_phase);

  if (fromIdx < 0 || toIdx < 0) {
    throw new ExecutionError('invalid_phase', `Unknown phase: ${payload.from_phase} or ${payload.to_phase}`);
  }

  if (toIdx !== fromIdx + 1) {
    throw new ExecutionError('invalid_transition', `Can only advance one phase at a time`);
  }

  // Optimistic lock: check current phase matches expected
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, phase')
    .eq('id', payload.company_id)
    .single();

  if (fetchError || !company) {
    throw new ExecutionError('not_found', 'Company not found');
  }

  if (company.phase !== payload.from_phase) {
    throw new ExecutionError(
      'stale',
      `Expected phase ${payload.from_phase}, found ${company.phase}`,
    );
  }

  // Execute the transition
  const { error: updateError } = await supabase
    .from('companies')
    .update({ phase: payload.to_phase })
    .eq('id', payload.company_id)
    .eq('phase', payload.from_phase); // Extra safety: only update if phase still matches

  if (updateError) {
    throw new ExecutionError('update_failed', updateError.message);
  }

  return { ok: true };
}
