'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast-provider';
import { taskPriorityLabels, taskCategoryLabels } from '@/lib/labels';
import { TEAM_MEMBERS } from '@/lib/constants';
import { selectClassName } from '@/lib/ui-utils';
import { QuickDatePicker } from '@/components/tasks/quick-date-picker';
import { createTaskFromDialog } from '@/app/(app)/tasks/actions';
import { Plus } from 'lucide-react';

interface TaskCreateDialogProps {
  companies: { id: string; name: string }[];
}

export function TaskCreateDialog({ companies }: TaskCreateDialogProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTaskFromDialog(formData);
    if (result?.error) {
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
      width={380}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
        >
          <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
          Ny oppgave
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-base font-semibold">Ny oppgave</h3>
        <div className="space-y-2">
          <Label htmlFor="new-title">Tittel</Label>
          <Input id="new-title" name="title" required autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-description">Beskrivelse</Label>
          <Textarea id="new-description" name="description" rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-priority">Prioritet</Label>
          <select id="new-priority" name="priority" defaultValue="medium" className={selectClassName}>
            {Object.entries(taskPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Frist</Label>
          <QuickDatePicker />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="new-category">Kategori</Label>
            <select id="new-category" name="category" defaultValue="" className={selectClassName}>
              <option value="">Ingen</option>
              {Object.entries(taskCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-hours">Timer</Label>
            <Input id="new-hours" name="estimated_hours" type="number" min="0.5" step="0.5" placeholder="f.eks. 6" />
          </div>
          <div className="space-y-2">
            <Label>Ansvarlig</Label>
            <div className="flex gap-1">
              {Object.entries(TEAM_MEMBERS).map(([email, name]) => (
                <label key={email} className="flex-1">
                  <input type="radio" name="assignee_email" value={email} className="sr-only peer" />
                  <div className="flex items-center justify-center rounded-lg border py-1.5 text-xs font-medium text-muted-foreground cursor-pointer transition-all duration-150 peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground hover:border-foreground/30">
                    {name}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-company">Kontakt</Label>
          <select id="new-company" name="company_id" defaultValue="" className={selectClassName}>
            <option value="">Ingen</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={saving}>
          {saving ? 'Oppretter...' : 'Opprett'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
