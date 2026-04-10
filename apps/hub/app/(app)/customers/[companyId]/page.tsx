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
import { CreateContractForm } from '@/components/contracts/create-contract-form';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { PHASES } from '@/lib/constants';
import { phaseLabels, phaseColors } from '@/lib/labels';

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

  const [qualificationResult, documentsResult] = await Promise.all([
    supabase
      .from('qualification_form_responses')
      .select('*')
      .eq('company_id', companyId)
      .single(),
    supabase
      .from('documents')
      .select('id, title, kind, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  const qualificationResponse = qualificationResult.data;
  const documents = documentsResult.data ?? [];

  const currentPhaseIndex = (PHASES as readonly string[]).indexOf(company.phase);
  const nextPhase = currentPhaseIndex < PHASES.length - 1 ? PHASES[currentPhaseIndex + 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className={phaseColors[company.phase] ?? ''}>
              {phaseLabels[company.phase] ?? company.phase}
            </Badge>
            <span className="text-sm text-muted-foreground">{company.country}</span>
            {company.flagged && (
              <Badge variant="destructive">Flagget</Badge>
            )}
            {documents.length > 0 && documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group relative"
                title={doc.title}
              >
                <FileText className="size-4 text-primary/50 transition-[color] duration-150 group-hover:text-primary" strokeWidth={1.75} />
              </Link>
            ))}
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
            <CardContent className="space-y-3">
              <div>
                <AgentTriggerButton
                  agent="agent_6_lead_research"
                  label="Firmasøk"
                  companyId={company.id}
                  companyName={company.name}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Henter grunnleggende info om selskapet fra nettet.
                </p>
              </div>
              <div>
                <AgentTriggerButton
                  agent="customer_research_agent"
                  label="Kunderesearch"
                  companyId={company.id}
                  companyName={company.name}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Full analyse — relevans, konkurrenter, marked og neste steg.
                </p>
              </div>
            </CardContent>
          </Card>
          <CreateContractForm companyId={company.id} companyName={company.name} />
        </div>
      </div>
    </div>
  );
}
