'use client';

import { useState } from 'react';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface QuickEmailButtonProps {
  email: string;
  name: string;
}

export function QuickEmailButton({ email, name }: QuickEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = () => {
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    setOpen(false);
    setSubject('');
    setBody('');
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={320}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground/40 transition-[color] duration-150 hover:text-primary"
          aria-label={`Send e-post til ${name}`}
          title="Send e-post"
        >
          <Mail className="size-4" strokeWidth={1.75} />
        </button>
      }
    >
      <div className="space-y-3">
        <h3 className="text-base font-semibold">E-post til {name}</h3>
        <p className="text-xs text-muted-foreground">{email}</p>
        <div className="space-y-2">
          <Label htmlFor={`qe-subject-${email}`}>Emne</Label>
          <Input
            id={`qe-subject-${email}`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`qe-body-${email}`}>Melding</Label>
          <Textarea
            id={`qe-body-${email}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
        </div>
        <Button size="sm" className="w-full" onClick={handleSend} disabled={!subject.trim()}>
          Åpne i e-postklient
        </Button>
      </div>
    </AnimatedPanel>
  );
}
