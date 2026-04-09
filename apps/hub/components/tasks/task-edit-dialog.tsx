'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { taskPriorityLabels, taskCategoryLabels } from '@/lib/labels';
import { updateTask, deleteTask } from '@/app/(app)/tasks/actions';
import { Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  company_id: string | null;
  companies: { name: string } | null;
  description?: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface TaskEditDialogProps {
  task: Task | null;
  companies: Company[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditDialog({ task, companies, open, onOpenChange }: TaskEditDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateTask(task.id, formData);

    if (result?.error) {
      alert(result.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTask(task.id);
    if (result?.error) {
      alert(result.error);
    } else {
      onOpenChange(false);
      router.refresh();
    }
    setDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rediger oppgave</DialogTitle>
          <DialogDescription>Endre detaljer for oppgaven.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Tittel *</Label>
            <Input
              id="edit-title"
              name="title"
              required
              defaultValue={task.title}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Beskrivelse</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={task.description ?? ''}
              rows={3}
              placeholder="Valgfri beskrivelse…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Prioritet</Label>
              <select
                id="edit-priority"
                name="priority"
                defaultValue={task.priority}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {Object.entries(taskPriorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategori</Label>
              <select
                id="edit-category"
                name="category"
                defaultValue={task.category ?? ''}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Ingen kategori</option>
                {Object.entries(taskCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">Kunde</Label>
              <select
                id="edit-company"
                name="company_id"
                defaultValue={task.company_id ?? ''}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Ingen kunde</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-due-date">Forfallsdato</Label>
              <Input
                id="edit-due-date"
                name="due_date"
                type="date"
                defaultValue={task.due_date ?? ''}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button type="button" variant="destructive" size="sm" disabled={deleting} />}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                {deleting ? 'Sletter…' : 'Slett'}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slett oppgave?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Er du sikker på at du vil slette &quot;{task.title}&quot;? Dette kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Slett oppgave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
                Avbryt
              </DialogClose>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Lagrer…' : 'Lagre'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
