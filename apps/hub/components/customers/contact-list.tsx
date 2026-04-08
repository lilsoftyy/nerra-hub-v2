'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { addContact } from '@/app/(app)/customers/actions';

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
}

export function ContactList({ contacts, companyId }: { contacts: Contact[]; companyId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const result = await addContact(companyId, formData);
    if (result?.error) {
      alert(result.error);
    } else {
      setAdding(false);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kontaktpersoner</CardTitle>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            Legg til
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-start justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">
                    {contact.full_name}
                    {contact.is_primary && (
                      <Badge variant="outline" className="ml-2 text-xs">Hovedkontakt</Badge>
                    )}
                  </p>
                  {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                  {contact.email && <p className="text-sm">{contact.email}</p>}
                  {contact.phone && <p className="text-sm">{contact.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !adding && <p className="text-sm text-muted-foreground">Ingen kontaktpersoner registrert.</p>
        )}

        {adding && (
          <form action={handleSubmit} className="mt-4 space-y-3 p-3 border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contact_name">Navn *</Label>
                <Input id="contact_name" name="full_name" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_email">E-post</Label>
                <Input id="contact_email" name="email" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input id="contact_phone" name="phone" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_role">Stilling</Label>
                <Input id="contact_role" name="role" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Avbryt</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Lagrer...' : 'Legg til'}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
