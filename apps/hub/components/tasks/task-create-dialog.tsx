'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { taskPriorityLabels, taskCategoryLabels } from '@/lib/labels';
import { selectClassName } from '@/lib/ui-utils';
import { createTaskFromDialog } from '@/app/(app)/tasks/actions';
import { Plus } from 'lucide-react';

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

const quickDates = [
  { label: 'I dag', days: 0 },
  { label: 'I morgen', days: 1 },
  { label: '3 dager', days: 3 },
  { label: '1 uke', days: 7 },
  { label: '2 uker', days: 14 },
];

interface TaskCreateDialogProps {
  companies: { id: string; name: string }[];
}

export function TaskCreateDialog({ companies }: TaskCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTaskFromDialog(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      setOpen(false);
      setDueDate('');
      setActiveDays(null);
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
          <div className="flex flex-wrap gap-1.5">
            {quickDates.map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => {
                  const date = addDays(q.days);
                  setDueDate(date);
                  setActiveDays(q.days);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  activeDays === q.days
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1] hover:text-foreground'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <input ref={dueDateRef} type="hidden" name="due_date" value={dueDate} />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
            <Label htmlFor="new-company">Kontakt</Label>
            <select id="new-company" name="company_id" defaultValue="" className={selectClassName}>
              <option value="">Ingen</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={saving}>
          {saving ? 'Oppretter...' : 'Opprett'}
        </Button>
      </form>
    </AnimatedPanel>
  );
}
