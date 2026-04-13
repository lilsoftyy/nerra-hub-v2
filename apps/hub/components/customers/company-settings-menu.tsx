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
          className="flex size-8 items-center justify-center text-muted-foreground/40 transition-[color,transform] duration-150 hover:text-foreground hover:scale-110 active:scale-95"
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
