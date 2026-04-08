import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  taskStatusLabels,
  taskStatusColors,
  taskPriorityLabels,
  taskPriorityColors,
  taskCategoryLabels,
} from '@/lib/labels';

interface TasksPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'alle';
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select('id, title, status, priority, category, due_date, company_id, companies(name)')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (statusFilter === 'open') {
    query = query.eq('status', 'open');
  } else if (statusFilter === 'in_progress') {
    query = query.eq('status', 'in_progress');
  } else if (statusFilter === 'done') {
    query = query.eq('status', 'done');
  }

  const { data: tasks } = await query;

  const tabs = [
    { key: 'alle', label: 'Alle' },
    { key: 'open', label: '\u00c5pne' },
    { key: 'in_progress', label: 'Under arbeid' },
    { key: 'done', label: 'Fullf\u00f8rte' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Oppgaver</h2>
        <Button render={<Link href="/tasks/new" />}>
          Opprett oppgave
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-[3px]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'alle' ? '/tasks' : `/tasks?status=${tab.key}`}
            className={`inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {tasks && tasks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioritet</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Forfallsdato</TableHead>
              <TableHead>Kunde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const company = task.companies as unknown as { name: string } | null;
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <a href="#" className="font-medium hover:underline">
                      {task.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge className={taskStatusColors[task.status] ?? ''}>
                      {taskStatusLabels[task.status] ?? task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={taskPriorityColors[task.priority] ?? ''}>
                      {taskPriorityLabels[task.priority] ?? task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.category ? (taskCategoryLabels[task.category] ?? task.category) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('nb-NO')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company?.name ?? '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          Ingen oppgaver funnet
        </div>
      )}
    </div>
  );
}
