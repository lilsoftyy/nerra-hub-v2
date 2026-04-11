'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  companies: { name: string } | null;
}

interface TaskCalendarProps {
  tasks: Task[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-start: Mon=0, Tue=1, ..., Sun=6
  return day === 0 ? 6 : day - 1;
}

const monthNames = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];

const dayLabels = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const todayStr = today.toISOString().split('T')[0];

  // Group tasks by due_date
  const tasksByDate: Record<string, Task[]> = {};
  for (const task of tasks) {
    if (task.due_date && task.status !== 'done') {
      const key = task.due_date;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key]!.push(task);
    }
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];

  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors">
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
        <p className="text-sm font-medium">
          {monthNames[month]} {year}
        </p>
        <button onClick={nextMonth} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors">
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground/50 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const dayTasks = tasksByDate[dateStr];
          const hasTasks = dayTasks && dayTasks.length > 0;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < todayStr! && hasTasks;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center justify-center h-8 rounded-lg text-xs transition-all duration-150 ${
                isSelected
                  ? 'bg-foreground text-background'
                  : isToday
                    ? 'font-semibold text-foreground'
                    : isPast
                      ? 'text-red-500'
                      : 'text-muted-foreground hover:bg-foreground/[0.05]'
              }`}
            >
              {day}
              {hasTasks && !isSelected && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={`size-1 rounded-full ${
                        isPast ? 'bg-red-400' : 'bg-primary/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date tasks */}
      {selectedDate && selectedTasks.length > 0 && (
        <div className="mt-3 border-t border-foreground/[0.06] pt-3 space-y-1.5">
          {selectedTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <span className={`size-1.5 rounded-full shrink-0 ${
                t.due_date && t.due_date < todayStr! ? 'bg-red-400' : 'bg-primary/60'
              }`} />
              <span className="truncate">{t.title}</span>
              {t.companies && (
                <span className="text-muted-foreground/50 truncate">· {t.companies.name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDate && selectedTasks.length === 0 && (
        <div className="mt-3 border-t border-foreground/[0.06] pt-3">
          <p className="text-xs text-muted-foreground/50 text-center">Ingen oppgaver denne dagen</p>
        </div>
      )}
    </div>
  );
}
