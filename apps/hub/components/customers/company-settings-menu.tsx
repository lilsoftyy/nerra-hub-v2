'use client';

import { useState } from 'react';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { GdprSection } from '@/components/customers/gdpr-section';
import { Settings } from 'lucide-react';

export function CompanySettingsMenu({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={240}
      anchor="bottom-right"
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex size-10 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]"
          title="Innstillinger"
        >
          <Settings className="size-4" strokeWidth={1.75} />
        </button>
      }
    >
      <GdprSection companyId={companyId} companyName={companyName} />
    </AnimatedPanel>
  );
}
