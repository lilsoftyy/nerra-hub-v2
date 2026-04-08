import { createClient } from '@/lib/supabase/server';
import type { ExecutionContext, ExecutionResult } from './types';
import { ExecutionError } from './types';
import { executePhaseTransition } from './executors/phase-transition';
import { v7 as uuidv7 } from 'uuid';

const executors: Record<string, (payload: Record<string, unknown>, ctx: ExecutionContext) => Promise<ExecutionResult>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase_transition: (p, c) => executePhaseTransition(p as any, c),
  // Other executors added in later phases:
  // task_creation, customer_update, calendar_event, email_draft, etc.
};

export async function executeProposal(proposalId: string, userId: string): Promise<ExecutionResult> {
  const supabase = await createClient();
  const requestId = uuidv7();

  // Fetch proposal
  const { data: proposal, error: fetchError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) {
    return { ok: false, error: 'Forslaget ble ikke funnet' };
  }

  if (proposal.status !== 'pending_approval') {
    return { ok: false, error: 'Forslaget er allerede behandlet' };
  }

  // Mark as approved_pending_execution
  await supabase
    .from('proposals')
    .update({
      status: 'approved_pending_execution',
      decided_at: new Date().toISOString(),
      decided_by: userId,
    })
    .eq('id', proposalId);

  const executor = executors[proposal.action_type ?? ''];

  if (!executor) {
    await supabase
      .from('proposals')
      .update({
        status: 'execution_failed',
        execution_error: `No executor for action_type: ${proposal.action_type}`,
        executed_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    return { ok: false, error: `Ingen handler for type: ${proposal.action_type}` };
  }

  const ctx: ExecutionContext = {
    proposal_id: proposalId,
    proposal: {
      id: proposal.id,
      agent_name: proposal.agent_name,
      action_type: proposal.action_type ?? 'other',
      payload: (proposal.payload ?? {}) as Record<string, unknown>,
      company_id: proposal.company_id,
    },
    user_id: userId,
    request_id: requestId,
  };

  try {
    const result = await executor((proposal.payload ?? {}) as Record<string, unknown>, ctx);

    await supabase
      .from('proposals')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    return result;
  } catch (err) {
    const errorMessage = err instanceof ExecutionError
      ? `${err.code}: ${err.message}`
      : err instanceof Error ? err.message : 'Unknown error';

    // CRITICAL: Mark as execution_failed, NEVER as rejected (spec 6.5.1)
    await supabase
      .from('proposals')
      .update({
        status: 'execution_failed',
        execution_error: errorMessage,
        executed_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    return { ok: false, error: errorMessage };
  }
}
