'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCalendarEvent } from '@/app/(app)/calendar/actions';
import { useToast } from '@/components/shared/toast-provider';
import { Trash2 } from 'lucide-react';

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const result = await deleteCalendarEvent(eventId);
    if (result.error) {
      addToast({ type: 'error', title: 'Feil', description: result.error });
    }
    router.refresh();
    setDeleting(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-muted-foreground/50 transition-[color] duration-150 hover:text-red-500 disabled:opacity-50"
      aria-label="Slett hendelse"
      title="Slett hendelse"
    >
      <Trash2 className="size-3.5" strokeWidth={1.75} />
    </button>
  );
}
