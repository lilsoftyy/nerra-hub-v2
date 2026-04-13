'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/shared/toast-provider';
import { updateCompany } from '@/app/(app)/customers/actions';

interface Company {
  id: string;
  name: string;
  country: string;
  operational_area: string | null;
  website: string | null;
  org_number: string | null;
  employee_count: number | null;
  facade_team_size: number | null;
  notes: string | null;
}

export function CustomerEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const result = await updateCompany(company.id, formData);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Firmainformasjon</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Rediger
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="text-muted-foreground">Firmanavn</dt>
            <dd>{company.name}</dd>
            <dt className="text-muted-foreground">Land</dt>
            <dd>{company.country}</dd>
            {company.org_number && (
              <>
                <dt className="text-muted-foreground">Org.nr</dt>
                <dd>{company.org_number}</dd>
              </>
            )}
            {company.website && (
              <>
                <dt className="text-muted-foreground">Nettside</dt>
                <dd><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></dd>
              </>
            )}
            {company.operational_area && (
              <>
                <dt className="text-muted-foreground">Operasjonsområde</dt>
                <dd>{company.operational_area}</dd>
              </>
            )}
            {company.employee_count && (
              <>
                <dt className="text-muted-foreground">Ansatte</dt>
                <dd>{company.employee_count}</dd>
              </>
            )}
            {company.notes && (
              <>
                <dt className="text-muted-foreground col-span-2">Notater</dt>
                <dd className="col-span-2 whitespace-pre-wrap">{company.notes}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rediger firmainformasjon</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Firmanavn</Label>
              <Input id="name" name="name" defaultValue={company.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input id="country" name="country" defaultValue={company.country} maxLength={2} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operational_area">Operasjonsområde</Label>
              <Input id="operational_area" name="operational_area" defaultValue={company.operational_area ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Nettside</Label>
              <Input id="website" name="website" defaultValue={company.website ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org_number">Org.nr</Label>
              <Input id="org_number" name="org_number" defaultValue={company.org_number ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_count">Ansatte</Label>
              <Input id="employee_count" name="employee_count" type="number" defaultValue={company.employee_count ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={company.notes ?? ''} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Avbryt</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Lagrer...' : 'Lagre'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
