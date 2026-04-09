import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkillAccordion } from '@/components/agents/skill-accordion';
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

/* ── Agent definitions ── */

const agents = [
  {
    name: 'Research-agent',
    description: 'Genererer research-rapporter om selskaper basert på nettsøk. Bruker Claude Sonnet med web search.',
    skill: 'research',
    status: 'aktiv' as const,
    trigger: 'Manuelt fra kundeprofil eller /research i Slack',
    icon: Search,
  },
  {
    name: 'Prosjektagent',
    description: 'Sjekker alle aktive kunders sjekkpunkter og foreslår faseoverganger via proposal-systemet.',
    skill: 'phase-transition',
    status: 'aktiv' as const,
    trigger: 'Manuelt fra dashboard',
    icon: FolderCheck,
  },
  {
    name: 'Kunderesearch-agent',
    description: 'Dyp, kontekstuell research på ett selskap — møtegrunnlag, regulatorisk kontekst, konkurrentlandskap.',
    skill: 'customer-research',
    status: 'planlagt' as const,
    trigger: 'Automatisk etter kvalifiseringsskjema',
    icon: Users,
  },
  {
    name: 'Lead Research-agent',
    description: 'Proaktiv prospektering — finner og kvalifiserer potensielle kunder i Europa.',
    skill: 'lead-research',
    status: 'planlagt' as const,
    trigger: 'Planlagt kjøring eller manuelt',
    icon: Search,
  },
  {
    name: 'E-postagent',
    description: 'Leser innkommende e-post, kategoriserer, og foreslår svarutkast i godkjenningskøen.',
    skill: 'email-draft',
    status: 'planlagt' as const,
    trigger: 'Automatisk ved ny e-post',
    icon: Mail,
  },
  {
    name: 'Outreach-agent',
    description: 'Skriver personalisert kald outreach-e-post til prospekter basert på lead research.',
    skill: 'outreach',
    status: 'planlagt' as const,
    trigger: 'Etter lead research er fullført',
    icon: Send,
  },
  {
    name: 'Kontraktagent',
    description: 'Strukturert intervju for å samle kundeinfo, prisberegning og tilbudsgenerering i EUR.',
    skill: 'contract',
    status: 'planlagt' as const,
    trigger: 'Manuelt fra kundeprofil',
    icon: FileSignature,
  },
];

const statusColors: Record<string, string> = {
  aktiv: 'bg-emerald-100 text-emerald-800',
  planlagt: 'bg-amber-100 text-amber-800',
};

/* ── Skill loading ── */

interface SkillInfo {
  name: string;
  filename: string;
  content: string;
}

const skillLabels: Record<string, string> = {
  research: 'Research-rapport',
  'email-draft': 'E-postutkast',
  'phase-transition': 'Faseovergang',
  contract: 'Kontraktgenerering',
  'lead-research': 'Lead Research',
  'customer-research': 'Kunderesearch',
  outreach: 'Outreach-skriving',
};

const skillDescriptions: Record<string, string> = {
  research: 'Enkel research-rapport om et firma basert på nettsøk',
  'customer-research': 'Dyp, kontekstuell research på ett selskap — møtegrunnlag og beslutningsstøtte',
  'lead-research': 'Proaktiv prospektering — finner og kvalifiserer potensielle kunder i Europa',
  outreach: 'Personalisert kald outreach-e-post til prospekter — basert på lead research',
  'email-draft': 'Leser innkommende e-post og foreslår et svar som utkast',
  'phase-transition': 'Overvåker kundeprosessen og foreslår faseoverganger basert på 17 steg',
  contract: 'Strukturert intervju, prisberegning og tilbudsdokument i EUR',
};

function loadAllSkills(): SkillInfo[] {
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

export default function AgentsPage() {
  const skills = loadAllSkills();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agenter og skills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oversikt over AI-agentene som jobber for Nerra, og oppskriftene (skills) de følger.
        </p>
      </div>

      {/* Agenter */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Agenter</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card key={agent.name}>
                <CardContent className="flex gap-4 pt-4 pb-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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
                    <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                      Trigger: {agent.trigger}
                    </p>
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
        <p className="mb-4 text-xs text-muted-foreground">
          Klikk på en skill for å se hele oppskriften agenten følger.
        </p>
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
