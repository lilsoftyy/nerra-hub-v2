import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhaseChangeButton } from '@/components/customers/phase-change-button';
import { PhaseChecklist } from '@/components/customers/phase-checklist';
import { ActivityLog } from '@/components/shared/activity-log';

const phaseLabels: Record<string, string> = {
  lead: 'Lead',
  qualification: 'Kvalifisering',
  sales: 'Salg',
  onboarding: 'Onboarding',
  training: 'Opplæring',
  operational: 'Operativ',
  finished: 'Ferdig',
};

const phaseColors: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  qualification: 'bg-blue-100 text-blue-800',
  sales: 'bg-yellow-100 text-yellow-800',
  onboarding: 'bg-purple-100 text-purple-800',
  training: 'bg-orange-100 text-orange-800',
  operational: 'bg-green-100 text-green-800',
  finished: 'bg-slate-100 text-slate-800',
};

const phases = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (!company) notFound();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false });

  const { data: checklistItems } = await supabase
    .from('phase_checklist_items')
    .select('*')
    .eq('company_id', companyId)
    .eq('phase', company.phase)
    .order('sort_order');

  const currentPhaseIndex = phases.indexOf(company.phase);
  const nextPhase = currentPhaseIndex < phases.length - 1 ? phases[currentPhaseIndex + 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{company.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className={phaseColors[company.phase] ?? ''}>
              {phaseLabels[company.phase] ?? company.phase}
            </Badge>
            <span className="text-sm text-muted-foreground">{company.country}</span>
            {company.flagged && (
              <Badge variant="destructive">Flagget</Badge>
            )}
          </div>
        </div>
        {nextPhase && (
          <PhaseChangeButton
            companyId={company.id}
            currentPhase={company.phase}
            nextPhase={nextPhase}
            nextPhaseLabel={phaseLabels[nextPhase] ?? nextPhase}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Firmainformasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {company.org_number && (
                  <>
                    <dt className="text-muted-foreground">Org.nr</dt>
                    <dd>{company.org_number}</dd>
                  </>
                )}
                {company.website && (
                  <>
                    <dt className="text-muted-foreground">Nettside</dt>
                    <dd><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></dd>
                  </>
                )}
                {company.operational_area && (
                  <>
                    <dt className="text-muted-foreground">Operasjonsomr&#229;de</dt>
                    <dd>{company.operational_area}</dd>
                  </>
                )}
                {company.employee_count && (
                  <>
                    <dt className="text-muted-foreground">Ansatte</dt>
                    <dd>{company.employee_count}</dd>
                  </>
                )}
                {company.facade_team_size && (
                  <>
                    <dt className="text-muted-foreground">Fasadeteam</dt>
                    <dd>{company.facade_team_size} personer</dd>
                  </>
                )}
                {company.notes && (
                  <>
                    <dt className="text-muted-foreground col-span-2">Notater</dt>
                    <dd className="col-span-2 whitespace-pre-wrap">{company.notes}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktpersoner</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">
                          {contact.full_name}
                          {contact.is_primary && (
                            <Badge variant="outline" className="ml-2 text-xs">Hovedkontakt</Badge>
                          )}
                        </p>
                        {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                        {contact.email && <p className="text-sm">{contact.email}</p>}
                        {contact.phone && <p className="text-sm">{contact.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen kontaktpersoner registrert.</p>
              )}
            </CardContent>
          </Card>

          {/* Activity log */}
          <ActivityLog companyId={company.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PhaseChecklist items={checklistItems ?? []} companyId={company.id} />
        </div>
      </div>
    </div>
  );
}
