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
import { QuickDatePicker } from '@/components/tasks/quick-date-picker';
import { createTaskFromDialog } from '@/app/(app)/tasks/actions';
import { Plus } from 'lucide-react';

const compactSelect =
  'flex h-7 w-full rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
const compactInput = 'h-7 px-2 text-xs md:text-xs';
const compactTextarea = 'min-h-12 text-xs md:text-xs';
const compactLabel = 'text-xs';

interface TaskCreateDialogProps {
  companies: { id: string; name: string }[];
  defaultStatus?: 'open' | 'in_progress';
}

export function TaskCreateDialog({ companies, defaultStatus = 'open' }: TaskCreateDialogProps) {
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
      width={320}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
        >
          <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
          legg til
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <h3 className="text-sm font-semibold">
          {defaultStatus === 'in_progress' ? 'Ny oppgave under arbeid' : 'Ny oppgave'}
        </h3>
        <input type="hidden" name="status" value={defaultStatus} />
        <div className="space-y-1.5">
          <Label htmlFor="new-title" className={compactLabel}>Tittel</Label>
          <Input id="new-title" name="title" required autoFocus className={compactInput} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-description" className={compactLabel}>Beskrivelse</Label>
          <Textarea id="new-description" name="description" rows={2} className={compactTextarea} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-priority" className={compactLabel}>Prioritet</Label>
          <select id="new-priority" name="priority" defaultValue="medium" className={compactSelect}>
            {Object.entries(taskPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={compactLabel}>Frist</Label>
          <QuickDatePicker />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="new-category" className={compactLabel}>Kategori</Label>
            <select id="new-category" name="category" defaultValue="" className={compactSelect}>
              <option value="">Ingen</option>
              {Object.entries(taskCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-hours" className={compactLabel}>Timer</Label>
            <Input id="new-hours" name="estimated_hours" type="number" min="0.5" step="0.5" placeholder="f.eks. 6" className={compactInput} />
          </div>
          <div className="space-y-1.5">
            <Label className={compactLabel}>Ansvarlig</Label>
            <div className="flex gap-1">
              {Object.entries(TEAM_MEMBERS).map(([email, name]) => (
                <label key={email} className="flex-1">
                  <input type="radio" name="assignee_email" value={email} className="sr-only peer" />
                  <div className="flex h-7 items-center justify-center rounded-lg border text-[10px] font-medium text-muted-foreground cursor-pointer transition-all duration-150 peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground hover:border-foreground/30">
                    {name}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-company" className={compactLabel}>Kontakt</Label>
          <select id="new-company" name="company_id" defaultValue="" className={compactSelect}>
            <option value="">Ingen</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" className="h-7 w-full text-xs" disabled={saving}>
          {saving ? 'Oppretter...' : 'Opprett'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
