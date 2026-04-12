'use client';

import { useState } from 'react';
import { KanbanBoard } from './kanban-board';
import { TaskListView } from './task-list-view';
import { TaskTimeline } from './task-timeline';
import { LayoutGrid, List } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  estimated_hours: number | null;
  assignee_agent: string | null;
  company_id: string | null;
  companies: { name: string } | null;
  description?: string | null;
}

interface TaskViewSwitcherProps {
  tasks: Task[];
  companies: { id: string; name: string }[];
}

export function TaskViewSwitcher({ tasks, companies }: TaskViewSwitcherProps) {
  const [view, setView] = useState<'board' | 'list'>('board');

  const btnClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
      active
        ? 'bg-foreground/[0.06] text-foreground'
        : 'text-muted-foreground/50 hover:text-foreground'
    }`;

  const timelineTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    start_date: t.start_date,
    created_at: t.created_at,
    estimated_hours: t.estimated_hours,
    priority: t.priority,
    status: t.status,
    category: t.category,
    companies: t.companies,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <button onClick={() => setView('board')} className={btnClass(view === 'board')}>
          <LayoutGrid className="size-3.5" strokeWidth={1.75} />
          Board
        </button>
        <button onClick={() => setView('list')} className={btnClass(view === 'list')}>
          <List className="size-3.5" strokeWidth={1.75} />
          Liste
        </button>
      </div>

      {view === 'board' && <KanbanBoard tasks={tasks} companies={companies} />}
      {view === 'list' && <TaskListView tasks={tasks} companies={companies} />}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Tidslinje</h2>
        <TaskTimeline tasks={timelineTasks} />
      </div>
    </div>
  );
}
