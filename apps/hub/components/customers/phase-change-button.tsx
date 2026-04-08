'use client';

import { Button } from '@/components/ui/button';
import { updateCompanyPhase } from '@/app/(app)/customers/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PhaseChangeButtonProps {
  companyId: string;
  currentPhase: string;
  nextPhase: string;
  nextPhaseLabel: string;
}

export function PhaseChangeButton({ companyId, currentPhase: _currentPhase, nextPhase, nextPhaseLabel }: PhaseChangeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await updateCompanyPhase(companyId, nextPhase);
    if (result?.error) {
      alert(result.error);
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
