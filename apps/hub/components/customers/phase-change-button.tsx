'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/toast-provider';
import { updateCompanyPhase } from '@/app/(app)/customers/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PhaseChangeButtonProps {
  companyId: string;
  nextPhase: string;
  nextPhaseLabel: string;
}

export function PhaseChangeButton({ companyId, nextPhase, nextPhaseLabel }: PhaseChangeButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await updateCompanyPhase(companyId, nextPhase);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Flytter...' : `Flytt til ${nextPhaseLabel}`}
    </Button>
  );
}
