'use client';

import { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';

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
  { label: '3 uker', days: 21 },
];

export { quickDates, addDays };

export function QuickDatePicker({ value, onChange }: { value?: string; onChange?: (date: string) => void }) {
  const [dueDate, setDueDate] = useState(value ?? '');
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const calendarRef = useRef<HTMLInputElement>(null);

  const selectDate = (date: string, days: number | null) => {
    setDueDate(date);
    setActiveDays(days);
    onChange?.(date);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {quickDates.map((q) => (
          <button
            key={q.days}
            type="button"
            onClick={() => selectDate(addDays(q.days), q.days)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              activeDays === q.days
                ? 'bg-foreground text-background'
                : 'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1] hover:text-foreground'
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => calendarRef.current?.showPicker()}
          className={`rounded-full px-2.5 py-1.5 text-xs transition-all duration-150 ${
            activeDays === -1
              ? 'bg-foreground text-background'
              : 'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1] hover:text-foreground'
          }`}
          title="Velg dato manuelt"
        >
          <Calendar className="size-3.5" strokeWidth={1.75} />
        </button>
        <input
          ref={calendarRef}
          type="date"
          className="sr-only"
          onChange={(e) => {
            if (e.target.value) selectDate(e.target.value, -1);
          }}
        />
      </div>
      <input type="hidden" name="due_date" value={dueDate} />
      {dueDate && (
        <p className="text-xs text-muted-foreground">
          Frist: {new Date(dueDate + 'T00:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      )}
    </div>
  );
}
