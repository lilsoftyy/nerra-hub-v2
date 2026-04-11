'use client';

import { useState } from 'react';

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

export function QuickDatePicker() {
  const [dueDate, setDueDate] = useState('');
  const [activeDays, setActiveDays] = useState<number | null>(null);

  return (
    <div className="space-y-2">
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
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              activeDays === q.days
                ? 'bg-foreground text-background'
                : 'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1] hover:text-foreground'
            }`}
          >
            {q.label}
          </button>
        ))}
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
