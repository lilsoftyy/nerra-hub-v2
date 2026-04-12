import { createClient } from '@/lib/supabase/server';
import { TaskViewSwitcher } from '@/components/tasks/task-view-switcher';

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksResult, companiesResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, description, status, priority, category, due_date, start_date, created_at, estimated_hours, assignee_agent, company_id, companies(name)')
      .in('status', ['open', 'in_progress', 'done'])
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('companies')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const tasks = (tasksResult.data ?? []).map((t) => ({
    ...t,
    companies: t.companies as unknown as { name: string } | null,
  }));

  const companies = (companiesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Oppgaver</h1>
      <TaskViewSwitcher tasks={tasks} companies={companies} />
    </div>
  );
}
