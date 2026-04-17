'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Tooltip } from '@/components/shared/tooltip';
import { useToast } from '@/components/shared/toast-provider';
import { cn } from '@/lib/utils';

export function RefreshAgentCard() {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    if (running) return;
    setRunning(true);
    const toastId = addToast({ type: 'loading', title: 'Oppdaterer kundene' });
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'agent_3_project' }),
      });
      const data = await res.json();
      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Feil', description: data.error });
      } else if (data.proposals_created !== undefined) {
        updateToast(toastId, {
          type: 'success',
          title: `${data.proposals_created} forslag opprettet`,
        });
      } else {
        updateToast(toastId, { type: 'success', title: 'Kundene er oppdatert' });
      }
      router.refresh();
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Tooltip label="Oppdater kundene med ny data fra epost og møter">
      <button
        type="button"
        onClick={handleClick}
        disabled={running}
        aria-label="Oppdater kundedata fra epost og møter"
        className={cn(
          'group/refresh relative flex h-11 md:h-10 items-center gap-2 overflow-hidden rounded-full border pl-2.5 pr-3',
          'bg-transparent',
          'transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
          'hover:bg-muted/50 hover:border-primary/25',
          'active:scale-[0.96]',
          'disabled:cursor-wait'
        )}
      >
        {/* Subtil gradient-bakgrunn ved hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover/refresh:opacity-100"
          style={{
            background:
              'linear-gradient(120deg, oklch(0.44 0.24 285 / 0.10) 0%, oklch(0.68 0.17 160 / 0.10) 100%)',
          }}
        />

        {/* Robot */}
        <div
          className={cn(
            'relative transition-[transform,color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
            'animate-[refresh-robot-bob_3.2s_ease-in-out_infinite]',
            'group-hover/refresh:-rotate-6'
          )}
        >
          <Bot
            aria-hidden="true"
            className="size-5 text-muted-foreground transition-colors duration-300 group-hover/refresh:text-foreground"
            strokeWidth={1.75}
          />
        </div>

        {/* Refresh-ikon (roterer mot klokken) */}
        <div
          className={cn(
            'relative animate-spin [animation-direction:reverse]',
            !running && '[animation-duration:5s] group-hover/refresh:[animation-duration:1.5s]',
            running && '[animation-duration:0.8s]'
          )}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="refresh-agent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.44 0.24 285)" />
                <stop offset="55%" stopColor="oklch(0.68 0.17 160)" />
                <stop offset="100%" stopColor="oklch(0.44 0.24 285)" />
              </linearGradient>
            </defs>
            <path
              d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
              stroke="url(#refresh-agent-grad)"
            />
            <path d="M3 3v5h5" stroke="url(#refresh-agent-grad)" />
            <path
              d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
              stroke="url(#refresh-agent-grad)"
            />
            <path d="M16 16h5v5" stroke="url(#refresh-agent-grad)" />
          </svg>
        </div>
      </button>
    </Tooltip>
  );
}
