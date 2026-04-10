import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkillAccordion } from '@/components/agents/skill-accordion';
import { AgentCommands } from '@/components/agents/agent-commands';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  Search,
  Users,
  Mail,
  FileSignature,
  Send,
  FolderCheck,
} from 'lucide-react';

const agents = [
  {
    name: 'Firmasøk',
    description: 'Søker opp grunnleggende info om et selskap fra nettet.',
    status: 'aktiv' as const,
    agentId: 'agent_6_lead_research',
    icon: Search,
  },
  {
    name: 'Kunderesearch',
    description: 'Full analyse — relevans, konkurrenter, marked og neste steg.',
    status: 'aktiv' as const,
    agentId: 'customer_research_agent',
    icon: Users,
  },
  {
    name: 'Prosjektagent',
    description: 'Sjekker sjekkpunkter og foreslår faseoverganger.',
    status: 'aktiv' as const,
    agentId: 'agent_3_project',
    icon: FolderCheck,
  },
  {
    name: 'E-postagent',
    description: 'Leser innkommende e-post og foreslår svarutkast.',
    status: 'planlagt' as const,
    agentId: 'email_agent',
    icon: Mail,
  },
  {
    name: 'Outreach-agent',
    description: 'Skriver personalisert kald outreach basert på lead research.',
    status: 'planlagt' as const,
    agentId: 'outreach_agent',
    icon: Send,
  },
  {
    name: 'Kontraktagent',
    description: 'Strukturert intervju, prisberegning og tilbudsdokument.',
    status: 'planlagt' as const,
    agentId: 'contract_agent',
    icon: FileSignature,
  },
];

const statusColors: Record<string, string> = {
  aktiv: 'bg-emerald-100 text-emerald-800',
  planlagt: 'bg-amber-100 text-amber-800',
};

const skillLabels: Record<string, string> = {
  research: 'Firmasøk',
  'email-draft': 'E-postutkast',
  'phase-transition': 'Faseovergang',
  contract: 'Kontraktgenerering',
  'lead-research': 'Lead Research',
  'customer-research': 'Kunderesearch',
  outreach: 'Outreach-skriving',
};

const skillDescriptions: Record<string, string> = {
  research: 'Søker opp grunnleggende info om et selskap fra nettet',
  'customer-research': 'Full analyse — relevans, konkurrenter, marked og neste steg',
  'lead-research': 'Proaktiv prospektering — finner og kvalifiserer potensielle kunder',
  outreach: 'Personalisert kald outreach-e-post til prospekter',
  'email-draft': 'Leser innkommende e-post og foreslår et svar som utkast',
  'phase-transition': 'Overvåker kundeprosessen og foreslår faseoverganger',
  contract: 'Strukturert intervju, prisberegning og tilbudsdokument i EUR',
};

function loadAllSkills() {
  const skillsDir = join(process.cwd(), 'lib', 'agents', 'skills');
  try {
    const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
    return files.map((filename) => {
      const content = readFileSync(join(skillsDir, filename), 'utf-8');
      const name = filename.replace('.md', '');
      return { name, filename, content };
    });
  } catch {
    return [];
  }
}

export default async function AgentsPage() {
  const skills = loadAllSkills();
  const supabase = await createClient();

  // Hent firma for kommandoer
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, phase')
    .is('deleted_at', null)
    .order('name');

  // Hent firma uten research-dokument for forslag
  const { data: allDocs } = await supabase
    .from('documents')
    .select('company_id, kind');

  const companyList = (companies ?? []).map((c) => ({ id: c.id, name: c.name }));

  // Bygg forslag basert på manglende dokumenter
  const docsByCompany = new Map<string, Set<string>>();
  for (const doc of allDocs ?? []) {
    if (!docsByCompany.has(doc.company_id)) docsByCompany.set(doc.company_id, new Set());
    docsByCompany.get(doc.company_id)!.add(doc.kind);
  }

  const suggestions: Array<{
    label: string;
    description: string;
    agent: string;
    companyId: string;
    companyName: string;
  }> = [];

  for (const company of companies ?? []) {
    const docs = docsByCompany.get(company.id);
    const hasResearch = docs?.has('research');
    const hasCustomerReport = docs?.has('customer_report');

    if (!hasResearch && !hasCustomerReport) {
      suggestions.push({
        label: `Research: ${company.name}`,
        description: 'Ingen rapport funnet — kjør enkel research',
        agent: 'agent_6_lead_research',
        companyId: company.id,
        companyName: company.name,
      });
    } else if (hasResearch && !hasCustomerReport && ['lead', 'qualification', 'sales'].includes(company.phase)) {
      suggestions.push({
        label: `Dyp research: ${company.name}`,
        description: 'Enkel rapport finnes — oppgrader til dyp kunderesearch',
        agent: 'customer_research_agent',
        companyId: company.id,
        companyName: company.name,
      });
    }
  }

  // Begrens til 5 forslag
  const topSuggestions = suggestions.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Agenter</h1>

      {/* Kommandoer og forslag */}
      <AgentCommands companies={companyList} suggestions={topSuggestions} />

      <Separator />

      {/* Agent-oversikt */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Alle agenter</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card key={agent.name}>
                <CardContent className="flex gap-3 pt-4 pb-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <Badge className={`text-[10px] ${statusColors[agent.status] ?? ''}`}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* Skills */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Skills</h2>
        <div className="space-y-2">
          {skills.map((skill) => (
            <SkillAccordion
              key={skill.name}
              name={skill.name}
              label={skillLabels[skill.name] ?? skill.name}
              description={skillDescriptions[skill.name] ?? ''}
              filename={skill.filename}
              content={skill.content}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
