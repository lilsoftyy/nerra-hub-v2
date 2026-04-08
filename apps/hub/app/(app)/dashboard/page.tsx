import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  phaseLabels,
  taskPriorityLabels,
  taskPriorityColors,
} from '@/lib/labels';

const phaseDotColors: Record<string, string> = {
  lead: 'bg-gray-400',
  qualification: 'bg-blue-400',
  sales: 'bg-yellow-400',
  onboarding: 'bg-purple-400',
  training: 'bg-orange-400',
  operational: 'bg-green-400',
  finished: 'bg-slate-400',
};

function formatNorwegianDate(date: Date): string {
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Akkurat n\u00e5';
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffHours < 24) return `${diffHours} t siden`;
  return `${diffDays} d siden`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all data in parallel
  const [
    companiesResult,
    openTasksResult,
    pendingProposalsResult,
    trainingCompaniesResult,
    myTasksResult,
    proposalsListResult,
    pipelineResult,
    activityResult,
  ] = await Promise.all([
    // Active companies count (non-finished, non-deleted)
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .neq('phase', 'finished'),
    // Open tasks count
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    // Pending approval proposals count
    supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    // Training phase companies count
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('phase', 'training'),
    // My tasks (open/in_progress, assigned to current user)
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, status, company_id, companies(name)')
      .in('status', ['open', 'in_progress'])
      .eq('assignee_id', user?.id ?? '')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),
    // Pending proposals
    supabase
      .from('proposals')
      .select('id, title, agent_name, company_id, created_at, companies(name)')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(10),
    // Pipeline: all non-deleted companies with phase
    supabase
      .from('companies')
      .select('phase')
      .is('deleted_at', null),
    // Recent activity
    supabase
      .from('activity_log')
      .select('id, action, actor_name, actor_type, company_id, created_at, companies(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const activeCompaniesCount = companiesResult.count ?? 0;
  const openTasksCount = openTasksResult.count ?? 0;
  const pendingProposalsCount = pendingProposalsResult.count ?? 0;
  const trainingCompaniesCount = trainingCompaniesResult.count ?? 0;

  const myTasks = myTasksResult.data ?? [];
  const proposals = proposalsListResult.data ?? [];
  const activities = activityResult.data ?? [];

  // Calculate pipeline counts
  const pipelineCounts: Record<string, number> = {};
  const phases = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];
  for (const phase of phases) {
    pipelineCounts[phase] = 0;
  }
  for (const company of pipelineResult.data ?? []) {
    pipelineCounts[company.phase] = (pipelineCounts[company.phase] ?? 0) + 1;
  }

  const stats = [
    { label: 'Aktive kunder', value: activeCompaniesCount },
    { label: '\u00c5pne oppgaver', value: openTasksCount },
    { label: 'Ventende godkjenninger', value: pendingProposalsCount },
    { label: 'Kunder i oppl\u00e6ring', value: trainingCompaniesCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground capitalize">
          {formatNorwegianDate(new Date())}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Mine oppgaver */}
          <Card>
            <CardHeader>
              <CardTitle>Mine oppgaver</CardTitle>
            </CardHeader>
            <CardContent>
              {myTasks.length > 0 ? (
                <div className="space-y-3">
                  {myTasks.map((task) => {
                    const company = task.companies as unknown as { name: string } | null;
                    return (
                      <div key={task.id} className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <a href="#" className="font-medium hover:underline">
                            {task.title}
                          </a>
                          {company && (
                            <p className="text-sm text-muted-foreground">{company.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={taskPriorityColors[task.priority] ?? ''}>
                            {taskPriorityLabels[task.priority] ?? task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(task.due_date).toLocaleDateString('nb-NO')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen \u00e5pne oppgaver</p>
              )}
            </CardContent>
          </Card>

          {/* Ventende godkjenninger */}
          <Card>
            <CardHeader>
              <CardTitle>Ventende godkjenninger</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length > 0 ? (
                <div className="space-y-3">
                  {proposals.map((proposal) => {
                    const company = proposal.companies as unknown as { name: string } | null;
                    return (
                      <div key={proposal.id} className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{proposal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {proposal.agent_name}
                            {company && ` \u2014 ${company.name}`}
                            {' \u00b7 '}
                            {formatRelativeTime(proposal.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default">
                            Godkjenn
                          </Button>
                          <Button size="sm" variant="outline">
                            Avvis
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen ventende godkjenninger</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Kundepipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Kundepipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phases.map((phase) => (
                  <div key={phase} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${phaseDotColors[phase] ?? 'bg-gray-400'}`}
                      />
                      <span className="text-sm">{phaseLabels[phase] ?? phase}</span>
                    </div>
                    <span className="text-sm font-medium">{pipelineCounts[phase] ?? 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Siste aktivitet */}
          <Card>
            <CardHeader>
              <CardTitle>Siste aktivitet</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const company = activity.companies as unknown as { name: string } | null;
                    return (
                      <div key={activity.id} className="text-sm">
                        <p>
                          <span className="font-medium">
                            {activity.actor_name ?? activity.actor_type}
                          </span>
                          {' \u2014 '}
                          {activity.action}
                        </p>
                        <p className="text-muted-foreground">
                          {company && `${company.name} \u00b7 `}
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen aktivitet enn\u00e5</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
