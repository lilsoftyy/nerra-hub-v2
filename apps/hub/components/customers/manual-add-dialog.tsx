'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast-provider';
import { Plus } from 'lucide-react';

interface ManualAddDialogProps {
  trigger?: React.ReactNode;
}

async function createCompanyFromDialog(data: {
  name: string;
  country: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
}) {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  const { v7: uuidv7 } = await import('uuid');

  const companyId = uuidv7();
  const { error: companyError } = await supabase.from('companies').insert({
    id: companyId,
    name: data.name,
    country: data.country,
    website: data.website || null,
    phase: 'contact',
  });

  if (companyError) return { error: companyError.message };

  if (data.contact_name) {
    await supabase.from('contacts').insert({
      id: uuidv7(),
      company_id: companyId,
      full_name: data.contact_name,
      email: data.contact_email || null,
      phone: data.contact_phone || null,
      role: data.contact_role || null,
      is_primary: true,
    });
  }

  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'human',
    action: 'company.created',
    entity_type: 'company',
    entity_id: companyId,
    company_id: companyId,
  });

  return { success: true, companyId };
}

export function ManualAddDialog({ trigger }: ManualAddDialogProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const result = await createCompanyFromDialog({
      name: form.get('name') as string,
      country: form.get('country') as string,
      website: form.get('website') as string,
      contact_name: form.get('contact_name') as string,
      contact_email: form.get('contact_email') as string,
      contact_phone: form.get('contact_phone') as string,
      contact_role: form.get('contact_role') as string,
    });

    if (result.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      setOpen(false);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => setOpen(false)}
      width={340}
      trigger={
        trigger ?? (
          <button
            onClick={() => setOpen(true)}
            className="flex size-10 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]"
            title="Legg til manuelt"
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-base font-semibold">Legg til manuelt</h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="manual-contact-name">Navn</Label>
            <Input id="manual-contact-name" name="contact_name" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-contact-role">Stilling</Label>
            <Input id="manual-contact-role" name="contact_role" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="manual-contact-email">E-post</Label>
            <Input id="manual-contact-email" name="contact_email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-contact-phone">Telefon</Label>
            <Input id="manual-contact-phone" name="contact_phone" />
          </div>
        </div>

        <div className="pt-1 border-t border-foreground/[0.06]">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 mb-2">Firma</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-name">Firmanavn</Label>
              <Input id="manual-name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-country">Land</Label>
              <Input id="manual-country" name="country" placeholder="Norge" required />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <Label htmlFor="manual-website">Nettside</Label>
            <Input id="manual-website" name="website" placeholder="https://" />
          </div>
        </div>

        <Button type="submit" size="sm" className="w-full" disabled={saving}>
          {saving ? 'Oppretter...' : 'Opprett'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
