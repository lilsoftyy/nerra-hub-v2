'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createCompany, type CreateCompanyState } from '../actions';

export default function NewCustomerPage() {
  const [state, formAction, isPending] = useActionState<CreateCompanyState, FormData>(
    createCompany,
    null,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Opprett kunde</h2>

      {state?.error?._form && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.error._form.join(', ')}
        </div>
      )}

      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>Firmainformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Firmanavn *</Label>
                <Input id="name" name="name" required />
                {state?.error?.name && (
                  <p className="text-sm text-red-600">{state.error.name[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Land (ISO) *</Label>
                <Input id="country" name="country" placeholder="NO" maxLength={2} required />
                {state?.error?.country && (
                  <p className="text-sm text-red-600">{state.error.country[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operational_area">Operasjonsområde</Label>
                <Input id="operational_area" name="operational_area" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Nettside</Label>
                <Input id="website" name="website" type="url" placeholder="https://" />
                {state?.error?.website && (
                  <p className="text-sm text-red-600">{state.error.website[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_number">Organisasjonsnummer</Label>
                <Input id="org_number" name="org_number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">Antall ansatte</Label>
                <Input id="employee_count" name="employee_count" type="number" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Hovedkontakt (valgfritt)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Navn</Label>
                <Input id="contact_name" name="contact_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-post</Label>
                <Input id="contact_email" name="contact_email" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input id="contact_phone" name="contact_phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_role">Stilling</Label>
                <Input id="contact_role" name="contact_role" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? 'Oppretter...' : 'Opprett kunde'}
          </Button>
        </div>
      </form>
    </div>
  );
}
