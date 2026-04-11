'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { createContactFromLookup } from '@/app/(app)/customers/actions';

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

export function AIContactLookup() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'review' | 'saving'>('search');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isPotentialCustomer, setIsPotentialCustomer] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep('search');
    setName('');
    setCompany('');
    setResult(null);
    setError(null);
    setIsPotentialCustomer(false);
  };

  const handleSearch = async () => {
    if (!name.trim() || !company.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), company: company.trim() }),
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
    setStep('saving');
    const res = await createContactFromLookup({ ...result, is_potential_customer: isPotentialCustomer });
    if (res?.error) { setError(res.error); setStep('review'); }
    else { setOpen(false); resetState(); router.refresh(); }
    setSaving(false);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => { setOpen(false); resetState(); }}
      trigger={
        <button
          onClick={() => { resetState(); setOpen(true); }}
          className="flex size-10 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]"
          title="AI-søk — finn og legg til person"
        >
          <Search className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      }
    >
      {step === 'search' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">AI-søk — legg til person</h3>
          <p className="text-xs text-muted-foreground">Søker nettet etter kontaktinfo og legger til automatisk</p>
          <div className="space-y-2">
            <Label htmlFor="lookup-name">Navn</Label>
            <Input id="lookup-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lookup-company">Selskap</Label>
            <Input id="lookup-company" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !name.trim() || !company.trim()}
            className="flex size-9 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity] duration-150 hover:opacity-80 disabled:opacity-40"
            aria-label="Søk"
          >
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" strokeWidth={1.75} />}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {step === 'review' && result && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Bekreft</h3>

          <div className="rounded-xl bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Person</p>
            <div className="grid grid-cols-2 gap-2">
              <Input value={result.person_name} onChange={(e) => setResult({ ...result, person_name: e.target.value })} className="h-8 text-xs" />
              <Input value={result.person_role ?? ''} onChange={(e) => setResult({ ...result, person_role: e.target.value || null })} placeholder="Rolle" className="h-8 text-xs" />
              <Input value={result.person_email ?? ''} onChange={(e) => setResult({ ...result, person_email: e.target.value || null })} placeholder="E-post" className="h-8 text-xs" />
              <Input value={result.person_phone ?? ''} onChange={(e) => setResult({ ...result, person_phone: e.target.value || null })} placeholder="Telefon" className="h-8 text-xs" />
            </div>
            {result.person_linkedin && (
              <a href={result.person_linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">LinkedIn-profil</a>
            )}
          </div>

          <div className="rounded-xl bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selskap</p>
            <p className="text-sm font-medium">{result.company_name}</p>
            {result.company_description && <p className="text-xs text-muted-foreground">{result.company_description}</p>}
            <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              {result.company_country && <span>{result.company_country}</span>}
              {result.company_employee_count && <span>· {result.company_employee_count} ansatte</span>}
              {result.company_website && (
                <a href={result.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {result.company_website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            {(result.company_email || result.company_phone) && (
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {result.company_email && <span>{result.company_email}</span>}
                {result.company_phone && <span>{result.company_phone}</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is-potential-customer" checked={isPotentialCustomer} onCheckedChange={(v) => setIsPotentialCustomer(v === true)} />
            <Label htmlFor="is-potential-customer" className="text-sm">Potensiell kunde</Label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setStep('search'); setResult(null); }}>Søk på nytt</Button>
            <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </AnimatedPanel>
  );
}
