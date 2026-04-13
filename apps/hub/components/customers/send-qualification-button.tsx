'use client';

import { useState } from 'react';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClipboardList } from 'lucide-react';
import { buildMailtoUrl } from '@/lib/ui-utils';

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  is_primary: boolean;
}

interface SendQualificationButtonProps {
  companyId: string;
  companyName: string;
  contacts: Contact[];
}

export function SendQualificationButton({ companyName, contacts }: SendQualificationButtonProps) {
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0];
  const email = primaryContact?.email;
  const qualificationUrl = 'https://nerra-qualification.vercel.app';

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Kvalifiseringsskjema — Drone Wash Academy`);
  const [body, setBody] = useState(
    `Hei ${primaryContact?.full_name ?? ''},\n\nVi sender deg et kort kvalifiseringsskjema i forbindelse med dronebasert fasadevask.\n\nFyll ut skjemaet her: ${qualificationUrl}\n\nMed vennlig hilsen\nNerra / Drone Wash Academy`
  );

  const handleSend = () => {
    if (!email) {
      window.open(qualificationUrl, '_blank');
      return;
    }
    window.open(buildMailtoUrl([email], subject, body), '_blank');
    setOpen(false);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={360}
      anchor="bottom-left"
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="size-4 text-primary" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">Send kvalifiseringsskjema</p>
            <p className="text-[10px] text-muted-foreground">
              {email ? `Til ${primaryContact?.full_name}` : 'Åpne skjema'}
            </p>
          </div>
        </button>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-3">
        <h3 className="text-base font-semibold">Send kvalifiseringsskjema</h3>
        {email && (
          <p className="text-xs text-muted-foreground">Til: {email}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="qual-subject">Emne</Label>
          <Input id="qual-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qual-body">Melding</Label>
          <Textarea id="qual-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        </div>
        <Button type="submit" size="sm" className="w-full">
          {email ? 'Åpne i e-postklient' : 'Åpne skjema'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
