'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Building2,
  Calendar,
  Search,
  Loader2,
} from 'lucide-react';
import { createContactFromLookup } from '@/app/(app)/customers/actions';
import { createCalendarEvent } from '@/app/(app)/calendar/actions';

interface LookupResult {
  person_name: string;
  person_email: string | null;
  person_role: string | null;
  person_phone: string | null;
  person_linkedin: string | null;
  company_name: string;
  company_country: string | null;
  company_website: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_employee_count: number | null;
  company_description: string | null;
  company_operational_area: string | null;
}

function AILookupPanel({ onClose, defaultMode }: { onClose: () => void; defaultMode: 'person' | 'company' }) {
  const router = useRouter();
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isPotentialCustomer, setIsPotentialCustomer] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (defaultMode === 'person' && (!name.trim() || !company.trim())) return;
    if (defaultMode === 'company' && !company.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || company.trim(), company: company.trim() }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setResult(data); setStep('review'); }
    } catch { setError('Noe gikk galt.'); }
    setSearching(false);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    const res = await createContactFromLookup({ ...result, is_potential_customer: isPotentialCustomer });
    if (res?.error) setError(res.error);
    else { onClose(); router.refresh(); }
    setSaving(false);
  };

  if (step === 'review' && result) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Bekreft</h3>
        <div className="rounded-xl bg-muted/30 px-4 py-3 space-y-1">
          <p className="text-sm font-medium">{result.person_name}</p>
          {result.person_role && <p className="text-xs text-muted-foreground">{result.person_role}</p>}
          {result.person_email && <p className="text-xs text-muted-foreground">{result.person_email}</p>}
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3 space-y-1">
          <p className="text-sm font-medium">{result.company_name}</p>
          {result.company_description && <p className="text-xs text-muted-foreground">{result.company_description}</p>}
          <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {result.company_country && <span>{result.company_country}</span>}
            {result.company_employee_count && <span>· {result.company_employee_count} ansatte</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="qa-potential" checked={isPotentialCustomer} onCheckedChange={(v) => setIsPotentialCustomer(v === true)} />
          <Label htmlFor="qa-potential" className="text-sm">Potensiell kunde</Label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => { setStep('search'); setResult(null); }}>Tilbake</Button>
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Lagrer...' : 'Lagre'}</Button>
        </div>
      </div>
    );
  }

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
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleSearch}
        disabled={searching || (defaultMode === 'person' ? (!name.trim() || !company.trim()) : !company.trim())}
        className="flex size-9 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity] duration-150 hover:opacity-80 disabled:opacity-40"
        aria-label="Søk"
      >
        {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" strokeWidth={1.75} />}
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

  const iconClass = "flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]";

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
            <UserPlus className="size-4" strokeWidth={1.75} />
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
            <Building2 className="size-4" strokeWidth={1.75} />
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
            <Calendar className="size-4" strokeWidth={1.75} />
          </button>
        }
      >
        <NewEventPanel onClose={() => setCalendarOpen(false)} />
      </AnimatedPanel>
    </div>
  );
}
