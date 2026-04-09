'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createContract } from '@/app/(app)/contracts/actions';

interface PackageLine {
  name: string;
  persons: number;
  price: number;
}

export function CreateContractForm({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<PackageLine[]>([
    { name: '', persons: 1, price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const subtotal = packages.reduce((sum, p) => sum + p.price * p.persons, 0);

  const addPackage = () => {
    setPackages([...packages, { name: '', persons: 1, price: 0 }]);
  };

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: keyof PackageLine, value: string | number) => {
    const updated = [...packages];
    const current = updated[index]!;
    updated[index] = {
      name: field === 'name' ? (value as string) : current.name,
      persons: field === 'persons' ? (value as number) : current.persons,
      price: field === 'price' ? (value as number) : current.price,
    };
    setPackages(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    formData.set('packages', JSON.stringify(packages));
    formData.set('subtotal', String(subtotal));
    await createContract(companyId, formData);
    setSaving(false);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Opprett kontrakt
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ny kontrakt for {companyName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Packages */}
          <div className="space-y-3">
            <Label>Pakker</Label>
            {packages.map((pkg, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label className="text-xs">Navn</Label>
                  <Input
                    value={pkg.name}
                    onChange={(e) => updatePackage(i, 'name', e.target.value)}
                    placeholder="f.eks. Grunnkurs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Antall</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.persons}
                    onChange={(e) => updatePackage(i, 'persons', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pris per stk</Label>
                  <Input
                    type="number"
                    min={0}
                    value={pkg.price}
                    onChange={(e) => updatePackage(i, 'price', Number(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePackage(i)}
                  disabled={packages.length === 1}
                >
                  Fjern
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPackage}>
              Legg til pakke
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Subtotal: {subtotal.toLocaleString('nb-NO')} NOK
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adjustment_percent">Justering (%)</Label>
              <Input id="adjustment_percent" name="adjustment_percent" type="number" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="currency">Valuta</Label>
              <Input id="currency" name="currency" defaultValue="NOK" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_until">Gyldig til</Label>
              <Input id="valid_until" name="valid_until" type="date" />
            </div>
            <div>
              <Label htmlFor="language">Sprak</Label>
              <Input id="language" name="language" defaultValue="no" placeholder="no / en" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Oppretter...' : 'Opprett kontrakt'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
