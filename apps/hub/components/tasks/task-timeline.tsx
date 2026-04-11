'use client';

import { useMemo } from 'react';
import { taskCategoryBarColors } from '@/lib/labels';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  priority: string;
  status: string;
  category: string | null;
  companies: { name: string } | null;
}

interface TaskTimelineProps {
  tasks: Task[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('nb-NO', { day: 'numeric' });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('nb-NO', { month: 'short' });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('nb-NO', { weekday: 'short' }).replace('.', '');
}


export function TaskTimeline({ tasks }: TaskTimelineProps) {
  const today = startOfDay(new Date());

  // Filtrer oppgaver som har due_date og ikke er done
  const timelineTasks = useMemo(() => {
    return tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .map((t) => {
        const created = startOfDay(new Date(t.created_at));
        const due = startOfDay(new Date(t.due_date!));
        return { ...t, createdDate: created, dueDate: due };
      })
      .sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
  }, [tasks]);

  if (timelineTasks.length === 0) {
    return (
      <div className="rounded-xl bg-muted/20 py-8 text-center">
        <p className="text-sm text-muted-foreground">Ingen oppgaver med frist</p>
      </div>
    );
  }

  // Beregn tidslinjeperiode: fra tidligste created til seneste due_date + buffer
  const earliest = timelineTasks.reduce(
    (min, t) => (t.createdDate < min ? t.createdDate : min),
    today
  );
  const latest = timelineTasks.reduce(
    (max, t) => (t.dueDate > max ? t.dueDate : max),
    today
  );

  const timelineStart = startOfDay(new Date(Math.min(earliest.getTime(), today.getTime())));
  const timelineEnd = addDays(latest, 3); // 3 dager buffer
  const totalDays = Math.max(daysBetween(timelineStart, timelineEnd), 7);

  // Generer dager for headeren
  const days: Date[] = [];
  for (let i = 0; i <= totalDays; i++) {
    days.push(addDays(timelineStart, i));
  }

  const dayWidth = 40; // px per dag
  const totalWidth = days.length * dayWidth;

  return (
    <div className="rounded-xl bg-muted/20 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Header med dager */}
          <div className="flex border-b border-foreground/[0.06] sticky top-0 bg-muted/20">
            {days.map((day, i) => {
              const isToday = daysBetween(today, day) === 0;
              const isFirstOfMonth = day.getDate() === 1;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center py-1.5 border-r border-foreground/[0.03] ${
                    isToday ? 'bg-primary/[0.08]' : isWeekend ? 'bg-foreground/[0.02]' : ''
                  }`}
                  style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                >
                  {(i === 0 || isFirstOfMonth) && (
                    <span className="text-[9px] font-medium text-muted-foreground/50 uppercase">
                      {formatMonth(day)}
                    </span>
                  )}
                  <span className={`text-[10px] ${isToday ? 'font-bold text-primary' : 'text-muted-foreground/60'}`}>
                    {formatDay(day)}
                  </span>
                  <span className={`text-[9px] ${isToday ? 'text-primary/60' : 'text-muted-foreground/30'}`}>
                    {formatWeekday(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Oppgave-rader */}
          <div>
            {timelineTasks.map((task) => {
              const startOffset = daysBetween(timelineStart, task.createdDate);
              const duration = Math.max(daysBetween(task.createdDate, task.dueDate), 1);
              const isPastDue = task.dueDate < today;
              const barColor = isPastDue ? 'bg-red-400/50' : (task.category ? (taskCategoryBarColors[task.category] ?? 'bg-primary/40') : 'bg-primary/40');

              return (
                <div
                  key={task.id}
                  className="relative flex items-center border-b border-foreground/[0.03]"
                  style={{ height: '36px' }}
                >
                  {/* Dag-rutenett (bakgrunn) */}
                  {days.map((day, i) => {
                    const isToday = daysBetween(today, day) === 0;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r border-foreground/[0.03] ${
                          isToday ? 'bg-primary/[0.04]' : isWeekend ? 'bg-foreground/[0.01]' : ''
                        }`}
                        style={{ left: `${i * dayWidth}px`, width: `${dayWidth}px` }}
                      />
                    );
                  })}

                  {/* Oppgave-bar */}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-md ${barColor} flex items-center px-2 overflow-hidden cursor-default transition-opacity hover:opacity-80`}
                    style={{
                      left: `${startOffset * dayWidth + 2}px`,
                      width: `${duration * dayWidth - 4}px`,
                    }}
                    title={`${task.title}${task.companies ? ` — ${task.companies.name}` : ''}`}
                  >
                    <span className="text-[10px] font-medium text-foreground/70 truncate">
                      {task.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dagens linje */}
          <div
            className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none z-10"
            style={{ left: `${daysBetween(timelineStart, today) * dayWidth + dayWidth / 2}px` }}
          />
        </div>
      </div>
    </div>
  );
}
