'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast-provider';
import { updateContact } from '@/app/(app)/customers/actions';
import { X, Search, Loader2 } from 'lucide-react';

interface PersonDetailPanelProps {
  contactId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  companyName: string | null;
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonDetailPanel({
  contactId, fullName, email, phone, role,
  companyName, companyId, open, onOpenChange,
}: PersonDetailPanelProps) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setMounted(true));
    else { setMounted(false); setClosing(false); }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setMounted(false); setClosing(false); onOpenChange(false); }, 200);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  if (!open) return null;

  const isVisible = mounted && !closing;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateContact(contactId, formData);
    if (result?.error) addToast({ type: 'error', title: 'Feil', description: result.error });
    else { handleClose(); router.refresh(); }
    setSaving(false);
  };

  const handleEnrich = async () => {
    setEnriching(true);
    const toastId = addToast({ type: 'loading', title: `Søker etter ${fullName}...` });

    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, company: companyName ?? '' }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Søk feilet', description: data.error });
        setEnriching(false);
        return;
      }

      const formData = new FormData();
      formData.set('full_name', fullName);
      formData.set('email', data.person_email ?? email ?? '');
      formData.set('phone', data.person_phone ?? phone ?? '');
      formData.set('role', data.person_role ?? role ?? '');

      const result = await updateContact(contactId, formData);
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
          title: `Oppdatert ${fullName}`,
          description: found.length > 0 ? `Fant: ${found.join(', ')}` : 'Ingen nye data funnet',
        });
        handleClose();
        router.refresh();
      }
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
    setEnriching(false);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={handleClose} style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)' }} />
      <div
        className="fixed z-50 rounded-2xl bg-popover p-5 text-sm ring-1 ring-foreground/10"
        style={{
          width: 380,
          top: '50%',
          left: '50%',
          transformOrigin: 'center',
          transform: `translate(-50%, -50%) ${isVisible ? 'scale(1)' : 'scale(0.95)'}`,
          opacity: isVisible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <button onClick={handleClose} className="absolute top-3 right-3 text-muted-foreground/50 transition-[color] duration-150 hover:text-foreground" aria-label="Lukk">
          <X className="size-4" strokeWidth={1.75} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">{fullName}</h3>
            {companyName && (
              <p className="text-xs text-muted-foreground">{companyName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pd-name">Navn</Label>
              <Input id="pd-name" name="full_name" defaultValue={fullName} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pd-role">Stilling</Label>
              <Input id="pd-role" name="role" defaultValue={role ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pd-email">E-post</Label>
              <Input id="pd-email" name="email" type="email" defaultValue={email ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pd-phone">Telefon</Label>
              <Input id="pd-phone" name="phone" defaultValue={phone ?? ''} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enriching}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-[color] duration-150 hover:text-primary disabled:opacity-50"
            >
              {enriching
                ? <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                : <Search className="size-3" strokeWidth={1.75} aria-hidden="true" />
              }
              Fyll ut med AI
            </button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
