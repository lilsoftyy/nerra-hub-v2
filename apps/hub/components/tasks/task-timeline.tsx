'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { taskCategoryBarColors } from '@/lib/labels';
import { updateTaskDates, updateTaskDueDate } from '@/app/(app)/tasks/actions';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  estimated_hours: number | null;
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

function addDaysToDate(date: Date, days: number): Date {
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

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_WIDTHS: Record<number, number> = { 1: 80, 2: 55, 4: 40, 6: 30 };

interface TimelineTask {
  id: string;
  title: string;
  startDate: Date;
  dueDate: Date;
  priority: string;
  status: string;
  category: string | null;
  estimated_hours: number | null;
  companies: { name: string } | null;
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
  const router = useRouter();
  const today = startOfDay(new Date());

  // Lokal state for oppgavene slik at drag-endringer vises med en gang
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>(() =>
    tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .map((t) => ({
        id: t.id,
        title: t.title,
        startDate: startOfDay(new Date(t.start_date ?? t.created_at)),
        dueDate: startOfDay(new Date(t.due_date!)),
        priority: t.priority,
        status: t.status,
        category: t.category,
        estimated_hours: t.estimated_hours,
        companies: t.companies,
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  );

  // Synkroniser med server-data
  useEffect(() => {
    setLocalTasks(
      tasks
        .filter((t) => t.due_date && t.status !== 'done')
        .map((t) => ({
          id: t.id,
          title: t.title,
          startDate: startOfDay(new Date(t.start_date ?? t.created_at)),
          dueDate: startOfDay(new Date(t.due_date!)),
          priority: t.priority,
          status: t.status,
          category: t.category,
          estimated_hours: t.estimated_hours,
          companies: t.companies,
        }))
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    );
  }, [tasks]);

  // Tidsperiode og zoom
  const [weeksToShow, setWeeksToShow] = useState(4);
  const dayWidth = DAY_WIDTHS[weeksToShow] ?? 40;

  // Drag state
  const dragRef = useRef<{
    taskId: string;
    type: 'move' | 'resize-end';
    startX: number;
    origStart: Date;
    origDue: Date;
  } | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, task: TimelineTask, type: 'move' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      taskId: task.id,
      type,
      startX: e.clientX,
      origStart: task.startDate,
      origDue: task.dueDate,
    };
    setDraggingId(task.id);
    setDragDelta(0);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaDays = Math.round(deltaX / dayWidth);
    setDragDelta(deltaDays);
  }, []);

  const handleMouseUp = useCallback(async () => {
    const drag = dragRef.current;
    if (!drag || dragDelta === 0) {
      dragRef.current = null;
      setDraggingId(null);
      setDragDelta(0);
      return;
    }

    let newDueDate: Date;
    let newStartDate = drag.origStart;

    if (drag.type === 'move') {
      newStartDate = addDaysToDate(drag.origStart, dragDelta);
      newDueDate = addDaysToDate(drag.origDue, dragDelta);
    } else {
      newDueDate = addDaysToDate(drag.origDue, dragDelta);
      if (newDueDate <= drag.origStart) {
        newDueDate = addDaysToDate(drag.origStart, 1);
      }
    }

    // Oppdater lokalt med en gang
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === drag.taskId
          ? { ...t, dueDate: newDueDate, startDate: newStartDate }
          : t
      )
    );

    dragRef.current = null;
    setDraggingId(null);
    setDragDelta(0);

    // Lagre til database i bakgrunnen
    if (drag.type === 'move') {
      await updateTaskDates(drag.taskId, toDateStr(newStartDate), toDateStr(newDueDate));
    } else {
      await updateTaskDueDate(drag.taskId, toDateStr(newDueDate));
    }
    router.refresh();
  }, [dragDelta, router]);

  if (localTasks.length === 0) {
    return (
      <div className="rounded-xl bg-muted/20 py-8 text-center">
        <p className="text-sm text-muted-foreground">Ingen oppgaver med frist</p>
      </div>
    );
  }

  const earliest = localTasks.reduce(
    (min, t) => (t.startDate < min ? t.startDate : min),
    today
  );
  const latest = localTasks.reduce(
    (max, t) => (t.dueDate > max ? t.dueDate : max),
    today
  );

  const timelineStart = startOfDay(new Date(Math.min(earliest.getTime(), today.getTime())));
  const minEnd = addDaysToDate(today, weeksToShow * 7);
  const timelineEnd = latest > minEnd ? addDaysToDate(latest, 3) : minEnd;
  const totalDays = daysBetween(timelineStart, timelineEnd);

  const days: Date[] = [];
  for (let i = 0; i <= totalDays; i++) {
    days.push(addDaysToDate(timelineStart, i));
  }

  const totalWidth = days.length * dayWidth;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[
          { label: '1 uke', weeks: 1 },
          { label: '2 uker', weeks: 2 },
          { label: '4 uker', weeks: 4 },
          { label: '6 uker', weeks: 6 },
        ].map((opt) => (
          <button
            key={opt.weeks}
            onClick={() => setWeeksToShow(opt.weeks)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-150 ${
              weeksToShow === opt.weeks
                ? 'bg-foreground/[0.06] text-foreground'
                : 'text-muted-foreground/40 hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-muted/20 overflow-hidden">
      <div
        className="overflow-x-auto select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative" style={{ minWidth: `${totalWidth}px` }}>
          {/* Header */}
          <div className="flex border-b border-foreground/[0.06] sticky top-0 bg-muted/20">
            {days.map((day, i) => {
              const isToday = daysBetween(today, day) === 0;
              const isFirstOfMonth = day.getDate() === 1;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center py-1.5 border-r border-foreground/[0.08] ${
                    isToday ? 'bg-primary/[0.08]' : isWeekend ? 'bg-foreground/[0.02]' : ''
                  }`}
                  style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                >
                  {(i === 0 || isFirstOfMonth) && (
                    <span className="text-[10px] font-bold text-foreground/70 uppercase">
                      {formatMonth(day)}
                    </span>
                  )}
                  <span className={`text-[12px] ${isToday ? 'font-bold text-primary' : 'font-semibold text-foreground/60'}`}>
                    {formatDay(day)}
                  </span>
                  <span className={`text-[10px] ${isToday ? 'font-medium text-primary/70' : 'font-medium text-foreground/40'}`}>
                    {formatWeekday(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Oppgave-rader */}
          <div>
            {localTasks.map((task) => {
              const isDragging = draggingId === task.id;
              let startOffset = daysBetween(timelineStart, task.startDate);
              let duration = Math.max(daysBetween(task.startDate, task.dueDate), 1);

              // Vis drag-preview i sanntid
              if (isDragging && dragRef.current) {
                if (dragRef.current.type === 'move') {
                  startOffset = daysBetween(timelineStart, dragRef.current.origStart) + dragDelta;
                  duration = Math.max(daysBetween(dragRef.current.origStart, dragRef.current.origDue), 1);
                } else {
                  startOffset = daysBetween(timelineStart, dragRef.current.origStart);
                  duration = Math.max(daysBetween(dragRef.current.origStart, dragRef.current.origDue) + dragDelta, 1);
                }
              }

              const isPastDue = task.dueDate < today && !isDragging;
              const barColor = isPastDue ? 'bg-red-400/50' : (task.category ? (taskCategoryBarColors[task.category] ?? 'bg-primary/40') : 'bg-primary/40');

              return (
                <div
                  key={task.id}
                  className="relative flex items-center border-b border-foreground/[0.06]"
                  style={{ height: '36px' }}
                >
                  {/* Dag-rutenett */}
                  {days.map((day, i) => {
                    const isToday = daysBetween(today, day) === 0;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r border-foreground/[0.08] ${
                          isToday ? 'bg-primary/[0.04]' : isWeekend ? 'bg-foreground/[0.01]' : ''
                        }`}
                        style={{ left: `${i * dayWidth}px`, width: `${dayWidth}px` }}
                      />
                    );
                  })}

                  {/* Oppgave-bar */}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-md ${barColor} flex items-center overflow-hidden transition-opacity ${isDragging ? 'opacity-80 z-10 shadow-md' : 'hover:opacity-80'}`}
                    style={{
                      left: `${startOffset * dayWidth + 2}px`,
                      width: `${duration * dayWidth - 4}px`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                    title={`${task.title}${task.companies ? ` — ${task.companies.name}` : ''}`}
                  >
                    <span className="text-[10px] font-medium text-foreground/70 truncate px-2 flex-1 pointer-events-none">
                      {task.title}
                    </span>

                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-foreground/20 rounded-r-md"
                      onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, task, 'resize-end'); }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
