'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateContact, deleteContact } from '@/app/(app)/customers/actions';
import { useToast } from '@/components/shared/toast-provider';
import { Settings, Trash2 } from 'lucide-react';

interface PersonEditButtonProps {
  contactId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

export function PersonEditButton({ contactId, fullName, email, phone, role }: PersonEditButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateContact(contactId, formData);
    if (result?.error) addToast({ type: 'error', title: 'Feil', description: result.error });
    else { setOpen(false); router.refresh(); }
    setSaving(false);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={300}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground/40 transition-[color] duration-150 hover:text-foreground"
          aria-label="Rediger kontakt"
        >
          <Settings className="size-4" strokeWidth={1.75} />
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-base font-semibold">Rediger</h3>
        <div className="space-y-2">
          <Label htmlFor={`pe-name-${contactId}`}>Navn</Label>
          <Input id={`pe-name-${contactId}`} name="full_name" defaultValue={fullName} required autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`pe-email-${contactId}`}>E-post</Label>
          <Input id={`pe-email-${contactId}`} name="email" type="email" defaultValue={email ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`pe-phone-${contactId}`}>Telefon</Label>
          <Input id={`pe-phone-${contactId}`} name="phone" defaultValue={phone ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`pe-role-${contactId}`}>Rolle</Label>
          <Input id={`pe-role-${contactId}`} name="role" defaultValue={role ?? ''} />
        </div>
        <div className="flex items-center justify-between pt-1">
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-red-500">
              <Trash2 className="size-3.5" strokeWidth={1.75} />
              Slett
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button type="button" variant="destructive" size="sm" onClick={async () => {
                setDeleting(true);
                const result = await deleteContact(contactId);
                if (result?.error) addToast({ type: 'error', title: 'Feil', description: result.error });
                else { setOpen(false); router.refresh(); }
                setDeleting(false);
              }} disabled={deleting}>
                {deleting ? 'Sletter...' : 'Bekreft'}
              </Button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:text-foreground">Avbryt</button>
            </div>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Lagrer...' : 'Lagre'}
          </Button>
        </div>
      </form>
    </AnimatedPanel>
  );
}
