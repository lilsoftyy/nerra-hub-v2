'use client';

import { useState } from 'react';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { deleteDocument } from '@/app/(app)/documents/[documentId]/actions';
import { Settings, Trash2 } from 'lucide-react';

interface DocumentActionsProps {
  documentId: string;
  title: string;
}

export function DocumentActions({ documentId, title }: DocumentActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteDocument(documentId);
  };

  return (
    <AnimatedPanel
      open={open}
      onClose={() => { setOpen(false); setConfirmDelete(false); }}
      width={240}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground/40 transition-[color] duration-150 hover:text-foreground"
          aria-label="Handlinger"
        >
          <Settings className="size-4" strokeWidth={1.75} />
        </button>
      }
    >
      <div className="space-y-1">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-[background-color] duration-150 hover:bg-red-50"
          >
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Slett dokument
          </button>
        ) : (
          <div className="space-y-2 px-1">
            <p className="text-xs text-muted-foreground">Slett &quot;{title}&quot;?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Sletter...' : 'Slett'}
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </div>
    </AnimatedPanel>
  );
}
