'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createContract } from '@/app/(app)/contracts/actions';
import { Plus, Trash2 } from 'lucide-react';
import { selectClassName } from '@/lib/ui-utils';

interface Company {
  id: string;
  name: string;
}

interface PackageLine {
  name: string;
  persons: number;
  price: number;
}

export function NewContractButton({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [packages, setPackages] = useState<PackageLine[]>([
    { name: '', persons: 1, price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const subtotal = packages.reduce((sum, p) => sum + p.price * p.persons, 0);

  const resetState = () => {
    setSelectedCompany('');
    setPackages([{ name: '', persons: 1, price: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set('packages', JSON.stringify(packages));
    formData.set('subtotal', String(subtotal));

    await createContract(selectedCompany, formData);
    setSaving(false);
    setOpen(false);
    resetState();
    router.refresh();
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => { setOpen(false); resetState(); }}
      width={400}
      trigger={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Ny kontrakt
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-base font-semibold">Ny kontrakt</h3>

        <div className="space-y-2">
          <Label>Firma</Label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className={selectClassName}
            required
          >
            <option value="">Velg firma...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Pakker</Label>
          {packages.map((pkg, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={pkg.name}
                onChange={(e) => {
                  const updated = [...packages];
                  updated[i] = { ...pkg, name: e.target.value };
                  setPackages(updated);
                }}
                placeholder="Pakkenavn"
                className="flex-1"
              />
              <Input
                type="number"
                value={pkg.persons}
                onChange={(e) => {
                  const updated = [...packages];
                  updated[i] = { ...pkg, persons: Number(e.target.value) || 1 };
                  setPackages(updated);
                }}
                className="w-16"
                min={1}
              />
              <Input
                type="number"
                value={pkg.price}
                onChange={(e) => {
                  const updated = [...packages];
                  updated[i] = { ...pkg, price: Number(e.target.value) || 0 };
                  setPackages(updated);
                }}
                className="w-24"
                min={0}
              />
              {packages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                  className="text-muted-foreground/40 hover:text-red-500 transition-[color] duration-150"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPackages([...packages, { name: '', persons: 1, price: 0 }])}
            className="text-xs text-muted-foreground hover:text-foreground transition-[color] duration-150"
          >
            + Legg til pakke
          </button>
        </div>

        {subtotal > 0 && (
          <p className="text-sm font-medium tabular-nums">
            Total: {subtotal.toLocaleString('nb-NO')} EUR
          </p>
        )}

        <Button type="submit" size="sm" className="w-full" disabled={saving || !selectedCompany}>
          {saving ? 'Oppretter...' : 'Opprett kontrakt'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
