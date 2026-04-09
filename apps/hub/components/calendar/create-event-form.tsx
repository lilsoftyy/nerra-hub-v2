'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCalendarEvent } from '@/app/(app)/calendar/actions';

export function CreateEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setResult(null);
    const res = await createCalendarEvent(formData);
    if (res.error) {
      setResult(`Feil: ${res.error}`);
    } else {
      setResult('Hendelse opprettet!');
      setOpen(false);
      router.refresh();
    }
    setSaving(false);
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Opprett hendelse
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ny kalenderhendelse</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" required placeholder="f.eks. Møte med Martin" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="date">Dato *</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div>
              <Label htmlFor="start_time">Fra *</Label>
              <Input id="start_time" name="start_time" type="time" required defaultValue="16:00" />
            </div>
            <div>
              <Label htmlFor="end_time">Til *</Label>
              <Input id="end_time" name="end_time" type="time" required defaultValue="17:00" />
            </div>
          </div>
          <div>
            <Label htmlFor="attendees">Deltakere (e-post, kommaseparert)</Label>
            <Input id="attendees" name="attendees" placeholder="martin@nerra.no" />
          </div>
          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          {result && <p className="text-sm text-muted-foreground">{result}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? 'Oppretter...' : 'Opprett'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
