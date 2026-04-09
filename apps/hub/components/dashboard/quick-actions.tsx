'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { useToast } from '@/components/shared/toast-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';
import { createContactFromLookup } from '@/app/(app)/customers/actions';
import { createCalendarEvent } from '@/app/(app)/calendar/actions';

function AILookupPanel({ onClose, defaultMode }: { onClose: () => void; defaultMode: 'person' | 'company' }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSearch = async () => {
    if (defaultMode === 'person' && (!name.trim() || !company.trim())) return;
    if (defaultMode === 'company' && !company.trim()) return;

    const searchName = name.trim() || company.trim();
    const searchCompany = company.trim();

    // Lukk popup umiddelbart
    onClose();

    // Vis loading-toast
    const toastId = addToast({
      type: 'loading',
      title: defaultMode === 'person' ? `Søker etter ${searchName}...` : `Søker etter ${searchCompany}...`,
    });

    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchName, company: searchCompany }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Søk feilet', description: data.error });
        return;
      }

      // Lagre kontakten direkte
      const saveResult = await createContactFromLookup({
        ...data,
        is_potential_customer: defaultMode === 'person',
      });

      if (saveResult?.error) {
        updateToast(toastId, { type: 'error', title: 'Kunne ikke lagre', description: saveResult.error });
      } else {
        updateToast(toastId, {
          type: 'success',
          title: data.company_name ?? searchCompany,
          description: [
            data.person_name,
            data.person_role,
            data.company_country,
            data.company_employee_count ? `${data.company_employee_count} ansatte` : null,
          ].filter(Boolean).join(' · '),
          action: {
            label: 'Se profil',
            onClick: () => router.push('/customers'),
          },
        });
        router.refresh();
      }
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">
        {defaultMode === 'person' ? 'Ny person' : 'Nytt selskap'}
      </h3>
      {defaultMode === 'person' && (
        <div className="space-y-2">
          <Label htmlFor="qa-name">Navn</Label>
          <Input id="qa-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="qa-company">Selskap</Label>
        <Input id="qa-company" value={company} onChange={(e) => setCompany(e.target.value)} autoFocus={defaultMode === 'company'} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
      </div>
      <button
        onClick={handleSearch}
        disabled={defaultMode === 'person' ? (!name.trim() || !company.trim()) : !company.trim()}
        className="flex size-9 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity] duration-150 hover:opacity-80 disabled:opacity-40"
        aria-label="Søk"
      >
        <Search className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function NewEventPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createCalendarEvent(formData);
    if (res.error) setError(res.error);
    else { onClose(); router.refresh(); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-base font-semibold">Ny hendelse</h3>
      <div className="space-y-2">
        <Label htmlFor="qa-event-title">Tittel</Label>
        <Input id="qa-event-title" name="title" required autoFocus />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label htmlFor="qa-event-date">Dato</Label>
          <Input id="qa-event-date" name="date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qa-event-start">Fra</Label>
          <Input id="qa-event-start" name="start_time" type="time" required defaultValue="10:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qa-event-end">Til</Label>
          <Input id="qa-event-end" name="end_time" type="time" required defaultValue="11:00" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa-event-attendees">Deltakere</Label>
        <Input id="qa-event-attendees" name="attendees" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={saving}>
        {saving ? 'Oppretter...' : 'Opprett'}
      </Button>
    </form>
  );
}

export function QuickActions() {
  const [personOpen, setPersonOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const iconClass = "flex size-12 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]";

  return (
    <div className="flex items-center gap-2">
      <AnimatedPanel
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <button onClick={() => setPersonOpen(true)} className={iconClass} title="Ny person">
            <UserPlus className="size-5" strokeWidth={1.75} />
          </button>
        }
      >
        <AILookupPanel onClose={() => setPersonOpen(false)} defaultMode="person" />
      </AnimatedPanel>

      <AnimatedPanel
        open={companyOpen}
        onClose={() => setCompanyOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <button onClick={() => setCompanyOpen(true)} className={iconClass} title="Nytt selskap">
            <Building2 className="size-5" strokeWidth={1.75} />
          </button>
        }
      >
        <AILookupPanel onClose={() => setCompanyOpen(false)} defaultMode="company" />
      </AnimatedPanel>

      <AnimatedPanel
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        width={340}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <button onClick={() => setCalendarOpen(true)} className={iconClass} title="Ny hendelse">
            <Calendar className="size-5" strokeWidth={1.75} />
          </button>
        }
      >
        <NewEventPanel onClose={() => setCalendarOpen(false)} />
      </AnimatedPanel>
    </div>
  );
}
