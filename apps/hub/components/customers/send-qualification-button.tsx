'use client';

import { ClipboardList, Mail } from 'lucide-react';
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

  const handleSend = () => {
    if (!email) {
      window.open(qualificationUrl, '_blank');
      return;
    }

    const subject = `Kvalifiseringsskjema — Drone Wash Academy`;
    const body = `Hei ${primaryContact?.full_name ?? ''},\n\nVi sender deg et kort kvalifiseringsskjema i forbindelse med dronebasert fasadevask.\n\nFyll ut skjemaet her: ${qualificationUrl}\n\nMed vennlig hilsen\nNerra / Drone Wash Academy`;

    window.open(buildMailtoUrl([email], subject, body), '_blank');
  };

  return (
    <button
      onClick={handleSend}
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
  );
}
