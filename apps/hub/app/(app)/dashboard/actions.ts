'use server';

import { createClient } from '@/lib/supabase/server';
import { executeProposal } from '@/lib/proposals/execute';
import { revalidatePath } from 'next/cache';

export async function approveProposal(proposalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Ikke innlogget' };

  const result = await executeProposal(proposalId, user.id);
  revalidatePath('/dashboard');
  revalidatePath('/customers');

  if (!result.ok) {
    return { error: result.error ?? 'Eksekvering feilet' };
  }

  return { success: true };
}

export async function rejectProposal(proposalId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Ikke innlogget' };

  const { error } = await supabase
    .from('proposals')
    .update({
      status: 'rejected',
      decided_at: new Date().toISOString(),
      decided_by: user.id,
      rejection_reason: reason ?? null,
    })
    .eq('id', proposalId)
    .eq('status', 'pending_approval');

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}
