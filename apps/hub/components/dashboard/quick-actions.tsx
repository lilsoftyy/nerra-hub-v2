'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import {
  Plus,
  UserPlus,
  Building2,
  Search,
  ClipboardList,
  Calendar,
} from 'lucide-react';

export function QuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={220}
      anchor="bottom-left"
      showClose={false}
      trigger={
        <button
          onClick={() => setOpen(!open)}
          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-80 active:scale-[0.93]"
          aria-label="Hurtighandlinger"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      }
    >
      <div className="space-y-1">
        <Link
          href="/customers/new"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <UserPlus className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          Ny person
        </Link>
        <Link
          href="/customers/new"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <Building2 className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          Nytt selskap
        </Link>
        <Link
          href="/tasks"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <ClipboardList className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          Ny oppgave
        </Link>
        <Link
          href="/calendar"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <Calendar className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          Ny hendelse
        </Link>
        <div className="my-1 h-px bg-border" />
        <Link
          href="/customers"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <Search className="size-4 text-primary/60" strokeWidth={1.75} aria-hidden="true" />
          AI-søk
        </Link>
      </div>
    </AnimatedPanel>
  );
}
