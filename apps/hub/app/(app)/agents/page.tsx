import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface SkillInfo {
  name: string;
  filename: string;
  content: string;
}

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
  contract: 'Strukturert intervju → prisberegning → tilbudsdokument i EUR',
};

export default function AgentsPage() {
  const skills = loadAllSkills();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Agenter og skills</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Oversikt over ferdige oppskrifter som agentene følger. Hver skill definerer nøyaktig
          hva agenten gjør, steg for steg.
        </p>
      </div>

      {/* Skills overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <Card key={skill.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {skillLabels[skill.name] ?? skill.name}
                </CardTitle>
                <Badge variant="secondary">{skill.filename}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {skillDescriptions[skill.name] ?? ''}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Full skill content */}
      {skills.map((skill) => (
        <Card key={skill.name} id={skill.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{skillLabels[skill.name] ?? skill.name}</CardTitle>
              <Badge variant="outline">{skill.filename}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MarkdownContent content={skill.content} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
