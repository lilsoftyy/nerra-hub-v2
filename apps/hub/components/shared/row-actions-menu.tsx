'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/toast-provider';
import { Settings, Trash2, Pencil } from 'lucide-react';

interface RowActionsMenuProps {
  /** Hva slags rad dette er */
  entityType: 'company' | 'contact';
  entityId: string;
  entityName: string;
  /** Server action for sletting */
  onDelete: (id: string) => Promise<{ error?: string }>;
  /** Klikk for å redigere (valgfritt) */
  onEdit?: () => void;
}

export function RowActionsMenu({ entityType, entityId, entityName, onDelete, onEdit }: RowActionsMenuProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await onDelete(entityId);
    if (result?.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    } else {
      addToast({ type: 'success', title: `${entityName} slettet` });
      setOpen(false);
      router.refresh();
    }
    setDeleting(false);
  };

  const label = entityType === 'company' ? 'firma' : 'kontakt';

  return (
    <AnimatedPanel
      open={open}
      onClose={() => { setOpen(false); setConfirmDelete(false); }}
      width={220}
      anchor="bottom-right"
      trigger={
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); setConfirmDelete(false); }}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground/30 transition-[color,background-color] duration-150 hover:bg-foreground/[0.05] hover:text-muted-foreground"
        >
          <Settings className="size-3.5" strokeWidth={1.75} />
        </button>
      }
    >
      <div className="space-y-1">
        {onEdit && (
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-[background-color] duration-150 hover:bg-muted/50"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
            Rediger {label}
          </button>
        )}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-[background-color] duration-150 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Slett {label}
          </button>
        ) : (
          <div className="space-y-2 px-1 py-1">
            <p className="text-xs text-muted-foreground">Slett {entityName}?</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Sletter...' : 'Bekreft'}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </div>
    </AnimatedPanel>
  );
}
