'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Search,
  Users,
  FolderCheck,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface Suggestion {
  label: string;
  description: string;
  agent: string;
  companyId: string;
  companyName: string;
}

interface AgentCommandsProps {
  companies: Company[];
  suggestions: Suggestion[];
}

export function AgentCommands({ companies, suggestions }: AgentCommandsProps) {
  const router = useRouter();
  const [researchOpen, setResearchOpen] = useState(false);
  const [deepResearchOpen, setDeepResearchOpen] = useState(false);
  const [projectRunning, setProjectRunning] = useState(false);
  const [projectResult, setProjectResult] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const runAgent = async (agent: string, companyId?: string) => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, company_id: companyId }),
      });
      const data = await res.json();
      if (data.error) setRunResult(`Feil: ${data.error}`);
      else {
        setRunResult('Ferdig — rapport opprettet under Dokumenter.');
        router.refresh();
      }
    } catch {
      setRunResult('Noe gikk galt.');
    }
    setRunning(false);
  };

  const runProjectAgent = async () => {
    setProjectRunning(true);
    setProjectResult(null);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'agent_3_project' }),
      });
      const data = await res.json();
      if (data.error) setProjectResult(`Feil: ${data.error}`);
      else {
        setProjectResult(`Ferdig. ${data.proposals_created ?? 0} forslag opprettet.`);
        router.refresh();
      }
    } catch {
      setProjectResult('Noe gikk galt.');
    }
    setProjectRunning(false);
  };

  const cmdClass = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 active:scale-[0.98] cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Foreslåtte handlinger */}
      {suggestions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary/60" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="text-sm font-semibold text-muted-foreground">Foreslåtte handlinger</h2>
          </div>
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => runAgent(s.agent, s.companyId)}
                disabled={running}
                className={cmdClass}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Play className="size-3.5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
          {runResult && <p className="mt-2 px-4 text-xs text-muted-foreground">{runResult}</p>}
        </section>
      )}

      {/* Kommandoer */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Kommandoer</h2>
        <div className="space-y-1">
          {/* Enkel research */}
          <AnimatedPanel
            open={researchOpen}
            onClose={() => { setResearchOpen(false); setSelectedCompany(''); setRunResult(null); }}
            width={320}
            anchor="bottom-left"
            trigger={
              <div onClick={() => setResearchOpen(true)} className={cmdClass}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Search className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Enkel research</p>
                  <p className="text-xs text-muted-foreground">Rask rapport basert på nettsøk</p>
                </div>
              </div>
            }
          >
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Enkel research</h3>
              <div className="space-y-2">
                <Label>Velg firma</Label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Velg...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {runResult && <p className="text-xs text-muted-foreground">{runResult}</p>}
              <Button
                size="sm"
                className="w-full"
                disabled={!selectedCompany || running}
                onClick={() => runAgent('agent_6_lead_research', selectedCompany)}
              >
                {running ? <><Loader2 className="size-4 animate-spin" />Kjører...</> : 'Kjør research'}
              </Button>
            </div>
          </AnimatedPanel>

          {/* Dyp kunderesearch */}
          <AnimatedPanel
            open={deepResearchOpen}
            onClose={() => { setDeepResearchOpen(false); setSelectedCompany(''); setRunResult(null); }}
            width={320}
            anchor="bottom-left"
            trigger={
              <div onClick={() => setDeepResearchOpen(true)} className={cmdClass}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Users className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Dyp kunderesearch</p>
                  <p className="text-xs text-muted-foreground">Grundig rapport med konkurrenter og marked</p>
                </div>
              </div>
            }
          >
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Dyp kunderesearch</h3>
              <div className="space-y-2">
                <Label>Velg firma</Label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Velg...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {runResult && <p className="text-xs text-muted-foreground">{runResult}</p>}
              <Button
                size="sm"
                className="w-full"
                disabled={!selectedCompany || running}
                onClick={() => runAgent('customer_research_agent', selectedCompany)}
              >
                {running ? <><Loader2 className="size-4 animate-spin" />Kjører...</> : 'Kjør kunderesearch'}
              </Button>
            </div>
          </AnimatedPanel>

          {/* Prosjektagent */}
          <div onClick={projectRunning ? undefined : runProjectAgent} className={`${cmdClass} ${projectRunning ? 'opacity-60' : ''}`}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              {projectRunning
                ? <Loader2 className="size-4 animate-spin text-muted-foreground" />
                : <FolderCheck className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              }
            </div>
            <div className="text-left">
              <p className="font-medium">{projectRunning ? 'Kjører...' : 'Sjekk faseoverganger'}</p>
              <p className="text-xs text-muted-foreground">
                {projectResult ?? 'Sjekker alle kunder og foreslår neste fase'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
