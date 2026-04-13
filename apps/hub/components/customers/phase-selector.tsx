'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { useToast } from '@/components/shared/toast-provider';
import { updateCompanyPhase } from '@/app/(app)/customers/actions';
import { phaseLabels, phaseColors } from '@/lib/labels';
import { PHASES, phaseDotColors } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PhaseSelector({ companyId, currentPhase }: { companyId: string; currentPhase: string }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const currentIndex = PHASES.indexOf(currentPhase as typeof PHASES[number]);

  const handleChange = async (newPhase: string) => {
    if (newPhase === currentPhase || updating) return;

    const newIndex = PHASES.indexOf(newPhase as typeof PHASES[number]);
    if (newIndex < currentIndex) {
      const confirmed = window.confirm(
        `Flytte fra "${phaseLabels[currentPhase] ?? currentPhase}" tilbake til "${phaseLabels[newPhase] ?? newPhase}"?`
      );
      if (!confirmed) return;
    }

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
      width={160}
      anchor="bottom-left"
      showClose={false}
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
      <div className="-m-2">
        {PHASES.map((phase) => (
          <button
            key={phase}
            onClick={() => handleChange(phase)}
            disabled={updating}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-[background-color] duration-150 ${
              phase === currentPhase ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`size-1.5 rounded-full ${phaseDotColors[phase] ?? 'bg-neutral-400'}`} />
            {phaseLabels[phase] ?? phase}
          </button>
        ))}
      </div>
    </AnimatedPanel>
  );
}
