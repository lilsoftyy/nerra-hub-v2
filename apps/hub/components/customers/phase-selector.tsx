'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { useToast } from '@/components/shared/toast-provider';
import { updateCompanyPhase } from '@/app/(app)/customers/actions';
import { phaseLabels } from '@/lib/labels';
import { PHASES, phaseDotColors } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { phaseColors } from '@/lib/labels';

export function PhaseSelector({ companyId, currentPhase }: { companyId: string; currentPhase: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newPhase: string) => {
    if (newPhase === currentPhase || updating) return;
    setUpdating(true);
    const result = await updateCompanyPhase(companyId, newPhase);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    }
    setOpen(false);
    setUpdating(false);
    router.refresh();
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={200}
      anchor="bottom-right"
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Badge variant="secondary" className={phaseColors[currentPhase] ?? ''}>
            {phaseLabels[currentPhase] ?? currentPhase}
          </Badge>
          <ChevronDown className="size-3 text-muted-foreground" strokeWidth={1.75} />
        </button>
      }
    >
      <div className="space-y-0.5">
        {PHASES.map((phase) => (
          <button
            key={phase}
            onClick={() => handleChange(phase)}
            disabled={updating}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-[background-color] duration-150 ${
              phase === currentPhase ? 'bg-foreground/[0.05] font-medium' : 'hover:bg-muted/50'
            }`}
          >
            <span className={`size-2 rounded-full ${phaseDotColors[phase] ?? 'bg-neutral-400'}`} />
            {phaseLabels[phase] ?? phase}
          </button>
        ))}
      </div>
    </AnimatedPanel>
  );
}
