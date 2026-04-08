'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { approveProposal, rejectProposal } from '@/app/(app)/dashboard/actions';

interface ProposalActionsProps {
  proposalId: string;
}

export function ProposalActions({ proposalId }: ProposalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setLoading('approve');
    const result = await approveProposal(proposalId);
    if (result.error) {
      alert(`Feil: ${result.error}`);
    }
    router.refresh();
    setLoading(null);
  };

  const handleReject = async () => {
    const reason = window.prompt('Begrunnelse for avvisning (valgfritt):');
    if (reason === null) return; // user cancelled prompt
    setLoading('reject');
    const result = await rejectProposal(proposalId, reason || undefined);
    if (result.error) {
      alert(`Feil: ${result.error}`);
    }
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading !== null}
      >
        {loading === 'approve' ? 'Godkjenner...' : 'Godkjenn'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={loading !== null}
      >
        {loading === 'reject' ? 'Avviser...' : 'Avvis'}
      </Button>
    </div>
  );
}
