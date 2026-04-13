'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/shared/toast-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { addContact, updateContact, setPrimaryContact } from '@/app/(app)/customers/actions';
import { Search, Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
}

export function ContactList({ contacts, companyId, companyName }: { contacts: Contact[]; companyId: string; companyName?: string }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const enrichContact = async (contact: Contact) => {
    setEnrichingId(contact.id);
    const toastId = addToast({ type: 'loading', title: `Søker etter ${contact.full_name}...` });

    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.full_name,
          company: companyName ?? '',
        }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Søk feilet', description: data.error });
        setEnrichingId(null);
        return;
      }

      // Oppdater kontakten med ny info
      const formData = new FormData();
      formData.set('full_name', contact.full_name);
      formData.set('email', data.person_email ?? contact.email ?? '');
      formData.set('phone', data.person_phone ?? contact.phone ?? '');
      formData.set('role', data.person_role ?? contact.role ?? '');

      const result = await updateContact(contact.id, formData);
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
          title: `Oppdatert ${contact.full_name}`,
          description: found.length > 0 ? `Fant: ${found.join(', ')}` : 'Ingen nye data funnet',
        });
        router.refresh();
      }
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
    setEnrichingId(null);
  };

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    const result = await addContact(companyId, formData);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      setAdding(false);
      router.refresh();
    }
    setSaving(false);
  };

  const handleUpdate = async (contactId: string, formData: FormData) => {
    setSaving(true);
    const result = await updateContact(contactId, formData);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      setEditingId(null);
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
            {contacts.map((contact) =>
              editingId === contact.id ? (
                <form
                  key={contact.id}
                  action={(formData) => handleUpdate(contact.id, formData)}
                  className="space-y-3 p-3 border rounded-lg"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit_name_${contact.id}`}>Navn *</Label>
                      <Input
                        id={`edit_name_${contact.id}`}
                        name="full_name"
                        defaultValue={contact.full_name}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit_email_${contact.id}`}>E-post</Label>
                      <Input
                        id={`edit_email_${contact.id}`}
                        name="email"
                        type="email"
                        defaultValue={contact.email ?? ''}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit_phone_${contact.id}`}>Telefon</Label>
                      <Input
                        id={`edit_phone_${contact.id}`}
                        name="phone"
                        defaultValue={contact.phone ?? ''}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit_role_${contact.id}`}>Stilling</Label>
                      <Input
                        id={`edit_role_${contact.id}`}
                        name="role"
                        defaultValue={contact.role ?? ''}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox
                      id={`primary_${contact.id}`}
                      defaultChecked={contact.is_primary}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          await setPrimaryContact(contact.id, companyId);
                          router.refresh();
                        }
                      }}
                    />
                    <Label htmlFor={`primary_${contact.id}`} className="text-xs text-muted-foreground">Hovedkontakt</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => enrichContact(contact)}
                      disabled={enrichingId === contact.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground transition-[color] duration-150 hover:text-primary disabled:opacity-50"
                    >
                      {enrichingId === contact.id
                        ? <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                        : <Search className="size-3" strokeWidth={1.75} aria-hidden="true" />
                      }
                      Fyll ut med AI
                    </button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Avbryt
                      </Button>
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Lagrer...' : 'Lagre'}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div
                  key={contact.id}
                  className="flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-[background-color] duration-150 hover:bg-muted/30"
                  onClick={() => setEditingId(contact.id)}
                >
                  <div>
                    <p className="font-medium">
                      {contact.full_name}
                      {contact.is_primary && (
                        <span className="ml-2 text-[10px] text-muted-foreground/50">hovedkontakt</span>
                      )}
                    </p>
                    {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                    {contact.email && <p className="text-sm">{contact.email}</p>}
                    {contact.phone && <p className="text-sm">{contact.phone}</p>}
                    {!contact.email && !contact.phone && (
                      <p className="text-xs text-muted-foreground/40 mt-1">Trykk for å redigere eller bruk AI-søk</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); enrichContact(contact); }}
                    disabled={enrichingId === contact.id}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition-[color,background-color] duration-150 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    title="Fyll ut med AI"
                  >
                    {enrichingId === contact.id
                      ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      : <Search className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    }
                  </button>
                </div>
              ),
            )}
          </div>
        ) : (
          !adding && <p className="text-sm text-muted-foreground">Ingen kontaktpersoner registrert.</p>
        )}

        {adding && (
          <form action={handleAdd} className="mt-4 space-y-3 p-3 border rounded-lg">
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
