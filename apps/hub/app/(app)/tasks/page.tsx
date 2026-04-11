import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskCalendar } from '@/components/tasks/task-calendar';

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksResult, companiesResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, description, status, priority, category, due_date, company_id, companies(name)')
      .in('status', ['open', 'in_progress', 'done'])
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('companies')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const kanbanTasks = (tasksResult.data ?? []).map((t) => ({
    ...t,
    companies: t.companies as unknown as { name: string } | null,
  }));

  const companies = (companiesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const calendarTasks = kanbanTasks.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    priority: t.priority,
    status: t.status,
    companies: t.companies,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Oppgaver</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <KanbanBoard tasks={kanbanTasks} companies={companies} />
        <aside>
          <TaskCalendar tasks={calendarTasks} />
        </aside>
      </div>
    </div>
  );
}
