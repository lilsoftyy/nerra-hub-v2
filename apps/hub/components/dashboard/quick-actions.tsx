'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { useToast } from '@/components/shared/toast-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Building2,
  Calendar,
  Search,
  CheckSquare,
} from 'lucide-react';
import { Tooltip } from '@/components/shared/tooltip';
import { taskPriorityLabels, taskCategoryLabels } from '@/lib/labels';
import { TEAM_MEMBERS } from '@/lib/constants';
import { QuickDatePicker } from '@/components/tasks/quick-date-picker';
import { createContactFromLookup } from '@/app/(app)/customers/actions';
import { createCalendarEvent } from '@/app/(app)/calendar/actions';
import { createTaskFromDialog } from '@/app/(app)/tasks/actions';

// Kompakte stiler for snarveispopups — matcher kanban-oppgavepopup
const compactSelect =
  'flex h-7 w-full rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
const compactInput = 'h-7 px-2 text-xs md:text-xs';
const compactLabel = 'text-xs';
const compactHeading = 'text-sm font-semibold';
const compactButton = 'h-7 w-full text-xs';

function AILookupPanel({ onClose, defaultMode }: { onClose: () => void; defaultMode: 'person' | 'company' }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSearch = async () => {
    if (defaultMode === 'person' && (!name.trim() || !company.trim())) return;
    if (defaultMode === 'company' && !company.trim()) return;

    const searchName = name.trim() || company.trim();
    const searchCompany = company.trim();

    // Lukk popup umiddelbart
    onClose();

    // Vis loading-toast
    const toastId = addToast({
      type: 'loading',
      title: defaultMode === 'person' ? `Søker etter ${searchName}...` : `Søker etter ${searchCompany}...`,
    });

    try {
      const res = await fetch('/api/agents/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchName, company: searchCompany }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Søk feilet', description: data.error });
        return;
      }

      // Lagre kontakten direkte
      const saveResult = await createContactFromLookup({
        ...data,
        is_potential_customer: defaultMode === 'person',
      });

      if (saveResult?.error) {
        updateToast(toastId, { type: 'error', title: 'Kunne ikke lagre', description: saveResult.error });
      } else {
        updateToast(toastId, {
          type: 'success',
          title: data.company_name ?? searchCompany,
          description: [
            data.person_name,
            data.person_role,
            data.company_country,
            data.company_employee_count ? `${data.company_employee_count} ansatte` : null,
          ].filter(Boolean).join(' · '),
          action: {
            label: 'Se profil',
            onClick: () => router.push('/customers'),
          },
        });
        router.refresh();
      }
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
  };

  return (
    <div className="space-y-2.5">
      <h3 className={compactHeading}>
        {defaultMode === 'person' ? 'Ny person' : 'Nytt selskap'}
      </h3>
      {defaultMode === 'person' && (
        <div className="space-y-1.5">
          <Label htmlFor="qa-name" className={compactLabel}>Navn</Label>
          <Input id="qa-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} className={compactInput} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="qa-company" className={compactLabel}>Selskap</Label>
        <Input id="qa-company" value={company} onChange={(e) => setCompany(e.target.value)} autoFocus={defaultMode === 'company'} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} className={compactInput} />
      </div>
      <button
        onClick={handleSearch}
        disabled={defaultMode === 'person' ? (!name.trim() || !company.trim()) : !company.trim()}
        className="flex size-8 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity] duration-150 hover:opacity-80 disabled:opacity-40"
        aria-label="Søk"
      >
        <Search className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function NewEventPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createCalendarEvent(formData);
    if (res.error) setError(res.error);
    else { onClose(); router.refresh(); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <h3 className={compactHeading}>Ny hendelse</h3>
      <div className="space-y-1.5">
        <Label htmlFor="qa-event-title" className={compactLabel}>Tittel</Label>
        <Input id="qa-event-title" name="title" required autoFocus className={compactInput} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="qa-event-date" className={compactLabel}>Dato</Label>
          <Input id="qa-event-date" name="date" type="date" required className={compactInput} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-event-start" className={compactLabel}>Fra</Label>
          <Input id="qa-event-start" name="start_time" type="time" required defaultValue="10:00" className={compactInput} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-event-end" className={compactLabel}>Til</Label>
          <Input id="qa-event-end" name="end_time" type="time" required defaultValue="11:00" className={compactInput} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="qa-event-attendees" className={compactLabel}>Deltakere</Label>
        <Input id="qa-event-attendees" name="attendees" className={compactInput} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" size="sm" className={compactButton} disabled={saving}>
        {saving ? 'Oppretter...' : 'Opprett'}
      </Button>
    </form>
  );
}

function NewTaskPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTaskFromDialog(formData);
    if (res?.error) addToast({ type: 'error', title: 'Feil', description: res.error });
    else { onClose(); router.refresh(); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <h3 className={compactHeading}>Ny oppgave</h3>
      <div className="space-y-1.5">
        <Label htmlFor="qa-task-title" className={compactLabel}>Tittel</Label>
        <Input id="qa-task-title" name="title" required autoFocus className={compactInput} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="qa-task-priority" className={compactLabel}>Prioritet</Label>
          <select id="qa-task-priority" name="priority" defaultValue="medium" className={compactSelect}>
            {Object.entries(taskPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-task-category" className={compactLabel}>Kategori</Label>
          <select id="qa-task-category" name="category" defaultValue="" className={compactSelect}>
            <option value="">Ingen</option>
            {Object.entries(taskCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="qa-task-hours" className={compactLabel}>Timer</Label>
          <Input id="qa-task-hours" name="estimated_hours" type="number" min="0.5" step="0.5" placeholder="f.eks. 6" className={compactInput} />
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
        <Label className={compactLabel}>Frist</Label>
        <QuickDatePicker />
      </div>
      <Button type="submit" size="sm" className={compactButton} disabled={saving}>
        {saving ? 'Oppretter...' : 'Opprett'}
      </Button>
    </form>
  );
}

export function QuickActions() {
  const [personOpen, setPersonOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const iconClass = "flex size-14 md:size-12 items-center justify-center rounded-full border text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 hover:text-foreground active:scale-[0.93]";

  return (
    <div className="flex items-center gap-2">
      <AnimatedPanel
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <Tooltip label="Ny person">
            <button onClick={() => setPersonOpen(true)} className={iconClass}>
              <UserPlus className="size-5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        }
      >
        <AILookupPanel onClose={() => setPersonOpen(false)} defaultMode="person" />
      </AnimatedPanel>

      <AnimatedPanel
        open={companyOpen}
        onClose={() => setCompanyOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <Tooltip label="Nytt selskap">
            <button onClick={() => setCompanyOpen(true)} className={iconClass}>
              <Building2 className="size-5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        }
      >
        <AILookupPanel onClose={() => setCompanyOpen(false)} defaultMode="company" />
      </AnimatedPanel>

      <AnimatedPanel
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <Tooltip label="Ny oppgave">
            <button onClick={() => setTaskOpen(true)} className={iconClass}>
              <CheckSquare className="size-5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        }
      >
        <NewTaskPanel onClose={() => setTaskOpen(false)} />
      </AnimatedPanel>

      <AnimatedPanel
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        width={320}
        anchor="bottom-left"
        showClose={true}
        trigger={
          <Tooltip label="Ny hendelse">
            <button onClick={() => setCalendarOpen(true)} className={iconClass}>
              <Calendar className="size-5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        }
      >
        <NewEventPanel onClose={() => setCalendarOpen(false)} />
      </AnimatedPanel>
    </div>
  );
}
