import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  phaseLabels,
  taskPriorityLabels,
  taskPriorityColors,
} from '@/lib/labels';
import { AgentTriggerButton } from '@/components/shared/agent-trigger-button';
import { ProposalActions } from '@/components/dashboard/proposal-actions';
import {
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Bot,
} from 'lucide-react';

const phaseDotColors: Record<string, string> = {
  lead: 'bg-neutral-400',
  qualification: 'bg-blue-500',
  sales: 'bg-amber-500',
  onboarding: 'bg-violet-500',
  training: 'bg-orange-500',
  operational: 'bg-emerald-500',
  finished: 'bg-neutral-300',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'God morgen';
  if (hour < 17) return 'God ettermiddag';
  return 'God kveld';
}

function getFirstName(email: string): string {
  const nameMap: Record<string, string> = {
    'magnus@nerra.no': 'Magnus',
    'martin@nerra.no': 'Martin',
  };
  return nameMap[email] ?? email.split('@')[0] ?? '';
}

function formatNorwegianDate(date: Date): string {
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Akkurat nå';
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffHours < 24) return `${diffHours} t siden`;
  return `${diffDays} d siden`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? 'dev@localhost';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [
    companiesResult,
    openTasksResult,
    pendingProposalsResult,
    trainingCompaniesResult,
    myTasksResult,
    todayTasksResult,
    overdueTasksResult,
    proposalsListResult,
    pipelineResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .neq('phase', 'finished'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('phase', 'training'),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, status, company_id, companies(name)')
      .in('status', ['open', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, status, company_id, companies(name)')
      .in('status', ['open', 'in_progress'])
      .eq('due_date', todayStr)
      .order('priority', { ascending: true })
      .limit(5),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, status, company_id, companies(name)')
      .in('status', ['open', 'in_progress'])
      .lt('due_date', todayStr)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('proposals')
      .select('id, title, agent_name, company_id, created_at, companies(name)')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('companies')
      .select('phase')
      .is('deleted_at', null),
    supabase
      .from('activity_log')
      .select('id, action, actor_name, actor_type, company_id, created_at, companies(name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const activeCompaniesCount = companiesResult.count ?? 0;
  const openTasksCount = openTasksResult.count ?? 0;
  const pendingProposalsCount = pendingProposalsResult.count ?? 0;
  const trainingCompaniesCount = trainingCompaniesResult.count ?? 0;

  const myTasks = myTasksResult.data ?? [];
  const todayTasks = todayTasksResult.data ?? [];
  const overdueTasks = overdueTasksResult.data ?? [];
  const proposals = proposalsListResult.data ?? [];
  const activities = activityResult.data ?? [];

  const pipelineCounts: Record<string, number> = {};
  const phases = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];
  for (const phase of phases) {
    pipelineCounts[phase] = 0;
  }
  for (const company of pipelineResult.data ?? []) {
    pipelineCounts[company.phase] = (pipelineCounts[company.phase] ?? 0) + 1;
  }
  const totalCompanies = (pipelineResult.data ?? []).length || 1;

  const firstName = getFirstName(userEmail);
  const greeting = getGreeting();
  const todayHasContent = todayTasks.length > 0 || overdueTasks.length > 0 || pendingProposalsCount > 0;

  const stats = [
    { label: 'Aktive kunder', value: activeCompaniesCount, href: '/customers' },
    { label: 'Åpne oppgaver', value: openTasksCount, href: '/tasks' },
    { label: 'Godkjenninger', value: pendingProposalsCount, href: undefined },
    { label: 'I opplæring', value: trainingCompaniesCount, href: '/customers' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">
            {formatNorwegianDate(today)}
          </p>
        </header>
        {todayHasContent && (
          <div className="flex items-center gap-4 text-sm">
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{overdueTasks.length} forfalt</span>
              </div>
            )}
            {todayTasks.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{todayTasks.length} i dag</span>
              </div>
            )}
            {pendingProposalsCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Bell className="size-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{pendingProposalsCount} venter</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const content = (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="transition-[opacity] duration-150 hover:opacity-80">
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left — 3/5 */}
        <div className="space-y-6 lg:col-span-3">
          {/* Oppgaver */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Mine oppgaver</CardTitle>
              <Link
                href="/tasks/new"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
              >
                <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
                Ny oppgave
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {myTasks.length > 0 ? (
                <div className="-mx-1">
                  {myTasks.map((task, i) => {
                    const company = task.companies as unknown as { name: string } | null;
                    return (
                      <div key={task.id}>
                        <Link
                          href="/tasks"
                          className="flex items-center justify-between gap-4 rounded-md px-1 py-2 transition-[background-color] duration-150 hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{task.title}</p>
                            {company && (
                              <p className="text-xs text-muted-foreground">{company.name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={taskPriorityColors[task.priority] ?? ''}>
                              {taskPriorityLabels[task.priority] ?? task.priority}
                            </Badge>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(task.due_date))}
                              </span>
                            )}
                          </div>
                        </Link>
                        {i < myTasks.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">Ingen åpne oppgaver</p>
                  <Link
                    href="/tasks/new"
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
                  >
                    <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
                    Opprett en oppgave
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Godkjenninger */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ventende godkjenninger</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {proposals.length > 0 ? (
                <div className="-mx-1">
                  {proposals.map((proposal, i) => {
                    const company = proposal.companies as unknown as { name: string } | null;
                    return (
                      <div key={proposal.id}>
                        <div className="flex items-center justify-between gap-4 rounded-md px-1 py-2 transition-[background-color] duration-150 hover:bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{proposal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {proposal.agent_name}
                              {company && ` — ${company.name}`}
                              {' · '}
                              {formatRelativeTime(proposal.created_at)}
                            </p>
                          </div>
                          <ProposalActions proposalId={proposal.id} />
                        </div>
                        {i < proposals.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">Ingen ventende godkjenninger</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Agentene har ikke foreslått noe ennå</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agenter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                <CardTitle className="text-sm font-medium">Agenter</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <AgentTriggerButton
                agent="agent_3_project"
                label="Kjør prosjektagent"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Sjekker alle kunder og foreslår faseoverganger basert på fullførte sjekkpunkter.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right — 2/5 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pipeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
              <Link
                href="/customers"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
              >
                Alle kunder
                <ArrowRight className="size-3" strokeWidth={2} aria-hidden="true" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {phases.map((phase) => {
                  const count = pipelineCounts[phase] ?? 0;
                  const pct = Math.round((count / totalCompanies) * 100);
                  return (
                    <div key={phase}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${phaseDotColors[phase] ?? 'bg-neutral-400'}`}
                            aria-hidden="true"
                          />
                          <span>{phaseLabels[phase] ?? phase}</span>
                        </div>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-muted">
                        <div
                          className={`h-1 rounded-full transition-[width] duration-300 ${phaseDotColors[phase] ?? 'bg-neutral-400'}`}
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={count}
                          aria-valuemin={0}
                          aria-valuemax={totalCompanies}
                          aria-label={`${phaseLabels[phase] ?? phase}: ${count}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Kalender-placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                <CardTitle className="text-sm font-medium">Kalender</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Kobles til Google Calendar snart.</p>
            </CardContent>
          </Card>

          {/* Aktivitet */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Siste aktivitet</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((activity) => {
                    return (
                      <div key={activity.id} className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm">
                          <span className="font-medium">
                            {activity.actor_name ?? activity.actor_type}
                          </span>
                          {' — '}
                          {activity.action}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Ingen aktivitet ennå</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
