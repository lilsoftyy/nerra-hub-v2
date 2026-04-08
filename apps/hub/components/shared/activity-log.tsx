import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const actionLabels: Record<string, string> = {
  'company.phase_changed': 'Faseendring',
  'company.created': 'Kunde opprettet',
  'company.updated': 'Kunde oppdatert',
  'contact.created': 'Kontakt lagt til',
  'task.created': 'Oppgave opprettet',
  'task.status_changed': 'Oppgavestatus endret',
};

interface ActivityLogProps {
  companyId: string;
}

export async function ActivityLog({ companyId }: ActivityLogProps) {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from('activity_log')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitetslogg</CardTitle>
      </CardHeader>
      <CardContent>
        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div>
                  <span className="font-medium">
                    {entry.actor_type === 'human' ? 'Bruker' : entry.actor_name ?? 'Agent'}
                  </span>
                  {' \u2014 '}
                  <span>{actionLabels[entry.action] ?? entry.action}</span>
                  {entry.details && typeof entry.details === 'object' && 'from' in entry.details && 'to' in entry.details && (
                    <span className="text-muted-foreground">
                      {' '}({String(entry.details.from)} \u2192 {String(entry.details.to)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen aktivitet registrert enn&#229;.</p>
        )}
      </CardContent>
    </Card>
  );
}
