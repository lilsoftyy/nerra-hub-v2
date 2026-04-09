'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCalendarEvent } from '@/app/(app)/calendar/actions';
import { Plus } from 'lucide-react';

export function CreateEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const res = await createCalendarEvent(formData);
    if (res.error) {
      setResult(`Feil: ${res.error}`);
    } else {
      setOpen(false);
      setResult(null);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Opprett hendelse
      </Button>

      <AnimatedPanel open={open} onClose={() => { setOpen(false); setResult(null); }} width={380}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="text-base font-semibold">Ny hendelse</h3>

          <div className="space-y-2">
            <Label htmlFor="title">Tittel</Label>
            <Input id="title" name="title" required autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Dato</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Fra</Label>
              <Input id="start_time" name="start_time" type="time" required defaultValue="16:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Til</Label>
              <Input id="end_time" name="end_time" type="time" required defaultValue="17:00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendees">Deltakere</Label>
            <Input id="attendees" name="attendees" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          {result && <p className="text-xs text-red-600">{result}</p>}
          <Button type="submit" size="sm" className="w-full" disabled={saving}>
            {saving ? 'Oppretter...' : 'Opprett'}
          </Button>
        </form>
      </AnimatedPanel>
    </div>
  );
}
