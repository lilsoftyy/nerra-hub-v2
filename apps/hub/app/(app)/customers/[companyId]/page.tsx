import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhaseSelector } from '@/components/customers/phase-selector';
import { PhaseChecklist } from '@/components/customers/phase-checklist';
import { ActivityLog } from '@/components/shared/activity-log';
import { CompanySettingsMenu } from '@/components/customers/company-settings-menu';
import { AgentTriggerButton } from '@/components/shared/agent-trigger-button';
import { CustomerEditForm } from '@/components/customers/customer-edit-form';
import { ContactList } from '@/components/customers/contact-list';
import { QualificationResponse } from '@/components/customers/qualification-response';
import { SendQualificationButton } from '@/components/customers/send-qualification-button';
import Link from 'next/link';
import { FileText, Check } from 'lucide-react';

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


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
            <PhaseSelector companyId={company.id} currentPhase={company.phase} />
          </div>
          <div className="flex items-center gap-3 mt-1">
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
        <CompanySettingsMenu companyId={company.id} companyName={company.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerEditForm company={company} />

          {/* Contacts */}
          <ContactList contacts={contacts ?? []} companyId={company.id} companyName={company.name} />

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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 -mt-2">
              <SendQualificationButton contacts={contacts ?? []} />
              <Link
                href={`/contracts?company=${company.id}`}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color] duration-150 hover:bg-muted/50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" strokeWidth={1.75} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Opprett kontrakt</p>
                </div>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI-agenter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <AgentTriggerButton
                  agent="agent_6_lead_research"
                  label="Firmasøk"
                  companyId={company.id}
                  companyName={company.name}
                />
                {documents.some((d) => d.kind === 'research') && (
                  <Check className="size-4 text-emerald-500" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <AgentTriggerButton
                  agent="customer_research_agent"
                  label="Kunderesearch"
                  companyId={company.id}
                  companyName={company.name}
                />
                {documents.some((d) => d.kind === 'customer_report') && (
                  <Check className="size-4 text-emerald-500" strokeWidth={2.5} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
