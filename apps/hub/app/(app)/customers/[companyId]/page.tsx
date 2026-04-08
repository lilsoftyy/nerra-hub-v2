import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhaseChangeButton } from '@/components/customers/phase-change-button';
import { PhaseChecklist } from '@/components/customers/phase-checklist';
import { ActivityLog } from '@/components/shared/activity-log';
import { GdprSection } from '@/components/customers/gdpr-section';
import { AgentTriggerButton } from '@/components/shared/agent-trigger-button';
import { CustomerEditForm } from '@/components/customers/customer-edit-form';
import { ContactList } from '@/components/customers/contact-list';
import { QualificationResponse } from '@/components/customers/qualification-response';

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

  const { data: qualificationResponse } = await supabase
    .from('qualification_form_responses')
    .select('*')
    .eq('company_id', companyId)
    .single();

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
          <CustomerEditForm company={company} />

          {/* Contacts */}
          <ContactList contacts={contacts ?? []} companyId={company.id} />

          {/* Qualification response */}
          {qualificationResponse && (
            <QualificationResponse response={qualificationResponse} />
          )}

          {/* Activity log */}
          <ActivityLog companyId={company.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PhaseChecklist items={checklistItems ?? []} companyId={company.id} />
          <GdprSection companyId={company.id} companyName={company.name} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI-agenter</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentTriggerButton
                agent="agent_6_lead_research"
                label="Generer research"
                companyId={company.id}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Bruker AI til å lage en research-rapport for denne kunden.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
