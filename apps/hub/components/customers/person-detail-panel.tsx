'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast-provider';
import { updateContact } from '@/app/(app)/customers/actions';
import { Search, Loader2 } from 'lucide-react';

interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company_name: string | null;
  is_primary?: boolean;
}

export function PersonDetailTrigger({ person }: { person: Person }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateContact(person.id, formData);
    if (result?.error) addToast({ type: 'error', title: 'Feil', description: result.error });
    else { setOpen(false); router.refresh(); }
    setSaving(false);
  };

  const handleEnrich = async () => {
    setEnriching(true);
    const toastId = addToast({ type: 'loading', title: `Søker etter ${person.full_name}...` });

    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: person.full_name, company: person.company_name ?? '' }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Søk feilet', description: data.error });
        setEnriching(false);
        return;
      }

      const formData = new FormData();
      formData.set('full_name', person.full_name);
      formData.set('email', data.person_email ?? person.email ?? '');
      formData.set('phone', data.person_phone ?? person.phone ?? '');
      formData.set('role', data.person_role ?? person.role ?? '');

      const result = await updateContact(person.id, formData);
      if (result?.error) {
        updateToast(toastId, { type: 'error', title: 'Kunne ikke oppdatere', description: result.error });
      } else {
        const found = [
          data.person_email && 'e-post',
          data.person_phone && 'telefon',
          data.person_role && 'stilling',
        ].filter(Boolean);
        updateToast(toastId, {
          type: 'success',
          title: `Oppdatert ${person.full_name}`,
          description: found.length > 0 ? `Fant: ${found.join(', ')}` : 'Ingen nye data funnet',
        });
        setOpen(false);
        router.refresh();
      }
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
    setEnriching(false);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={360}
      anchor="bottom-left"
      trigger={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left"
        >
          <p className="text-sm font-medium hover:text-primary transition-[color] duration-150">{person.full_name}</p>
          {person.role && <p className="text-xs text-muted-foreground">{person.role}</p>}
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">{person.full_name}</h3>
          {person.company_name && (
            <p className="text-xs text-muted-foreground">{person.company_name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`pd-name-${person.id}`}>Navn</Label>
            <Input id={`pd-name-${person.id}`} name="full_name" defaultValue={person.full_name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pd-role-${person.id}`}>Stilling</Label>
            <Input id={`pd-role-${person.id}`} name="role" defaultValue={person.role ?? ''} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`pd-email-${person.id}`}>E-post</Label>
            <Input id={`pd-email-${person.id}`} name="email" type="email" defaultValue={person.email ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pd-phone-${person.id}`}>Telefon</Label>
            <Input id={`pd-phone-${person.id}`} name="phone" defaultValue={person.phone ?? ''} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleEnrich}
            disabled={enriching}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-[color] duration-150 hover:text-primary disabled:opacity-50"
          >
            {enriching
              ? <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              : <Search className="size-3" strokeWidth={1.75} aria-hidden="true" />
            }
            Fyll ut med AI
          </button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Lagrer...' : 'Lagre'}
          </Button>
        </div>
      </form>
    </AnimatedPanel>
  );
}
