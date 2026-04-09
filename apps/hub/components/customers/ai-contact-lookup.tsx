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
  company_name: string;
  company_country: string | null;
  company_website: string | null;
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
        <Button size="sm" onClick={() => { resetState(); setOpen(true); }}>
          <Search className="size-4" strokeWidth={1.75} aria-hidden="true" />
          AI-søk
        </Button>
      }
    >
      {step === 'search' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Finn kontakt</h3>
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
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Bekreft</h3>
          <div className="rounded-xl bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Person</p>
            <p className="text-sm font-medium">{result.person_name}</p>
            {result.person_role && <p className="text-xs text-muted-foreground">{result.person_role}</p>}
            {result.person_email && <p className="text-xs text-muted-foreground">{result.person_email}</p>}
            {result.person_phone && <p className="text-xs text-muted-foreground">{result.person_phone}</p>}
          </div>
          <div className="rounded-xl bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Selskap</p>
            <p className="text-sm font-medium">{result.company_name}</p>
            {result.company_description && <p className="text-xs text-muted-foreground mt-0.5">{result.company_description}</p>}
            <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              {result.company_country && <span>{result.company_country}</span>}
              {result.company_employee_count && <span>· {result.company_employee_count} ansatte</span>}
              {result.company_website && (
                <a href={result.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {result.company_website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is-potential-customer" checked={isPotentialCustomer} onCheckedChange={(v) => setIsPotentialCustomer(v === true)} />
            <Label htmlFor="is-potential-customer" className="text-sm">Potensiell kunde</Label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setStep('search'); setResult(null); }}>Søk på nytt</Button>
            <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Lagrer...' : 'Lagre kontakt'}</Button>
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
