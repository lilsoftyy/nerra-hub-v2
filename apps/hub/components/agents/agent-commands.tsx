'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { useToast } from '@/components/shared/toast-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { selectClassName } from '@/lib/ui-utils';
import {
  Search,
  Users,
  FolderCheck,
  Play,
  Sparkles,
} from 'lucide-react';

interface Company { id: string; name: string }

interface Suggestion {
  label: string;
  description: string;
  agent: string;
  companyId: string;
  companyName: string;
}

function ResearchPanel({
  title, agentName, label, companies, onRun,
}: {
  title: string; agentName: string; label: string; companies: Company[]; onRun: (agent: string, companyId: string, label: string) => void;
}) {
  const [selected, setSelected] = useState('');
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="space-y-2">
        <Label>Velg firma</Label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={selectClassName}>
          <option value="">Velg...</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Button size="sm" className="w-full" disabled={!selected} onClick={() => { onRun(agentName, selected, label); }}>
        Kjør
      </Button>
    </div>
  );
}

export function AgentCommands({ companies, suggestions }: { companies: Company[]; suggestions: Suggestion[] }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [researchOpen, setResearchOpen] = useState(false);
  const [deepResearchOpen, setDeepResearchOpen] = useState(false);

  const runAgent = async (agent: string, companyId: string, label: string) => {
    const companyName = companies.find((c) => c.id === companyId)?.name ?? '';
    setResearchOpen(false);
    setDeepResearchOpen(false);

    const toastId = addToast({ type: 'loading', title: `${label} — ${companyName}` });

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, company_id: companyId }),
      });
      const data = await res.json();
      if (data.error) {
        updateToast(toastId, { type: 'error', title: 'Feil', description: data.error });
      } else if (data.document_id) {
        updateToast(toastId, { type: 'success', title: `${label} ferdig`, action: { label: 'Se rapport', onClick: () => router.push(`/documents/${data.document_id}`) } });
      } else {
        updateToast(toastId, { type: 'success', title: `${label} ferdig` });
      }
      router.refresh();
    } catch {
      updateToast(toastId, { type: 'error', title: 'Noe gikk galt' });
    }
  };

  const runProjectAgent = async () => {
    const toastId = addToast({ type: 'loading', title: 'Sjekker faseoverganger' });
    try {
      const res = await fetch('/api/agents/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'agent_3_project' }) });
      const data = await res.json();
      if (data.error) updateToast(toastId, { type: 'error', title: 'Feil', description: data.error });
      else updateToast(toastId, { type: 'success', title: `${data.proposals_created ?? 0} forslag opprettet` });
      router.refresh();
    } catch { updateToast(toastId, { type: 'error', title: 'Noe gikk galt' }); }
  };

  const cmdClass = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted/50 active:scale-[0.98] cursor-pointer";

  return (
    <div className="space-y-6">
      {suggestions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary/60" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="text-sm font-semibold text-muted-foreground">Foreslåtte handlinger</h2>
          </div>
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => runAgent(s.agent, s.companyId, s.label)} className={cmdClass}>
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
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Kommandoer</h2>
        <div className="space-y-1">
          <AnimatedPanel open={researchOpen} onClose={() => setResearchOpen(false)} width={320} anchor="bottom-left"
            trigger={<div onClick={() => setResearchOpen(true)} className={cmdClass}><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Search className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" /></div><div className="text-left"><p className="font-medium">Firmasøk</p><p className="text-xs text-muted-foreground">Grunnleggende info om selskapet fra nettet</p></div></div>}>
            <ResearchPanel title="Firmasøk" agentName="agent_6_lead_research" label="Firmasøk" companies={companies} onRun={runAgent} />
          </AnimatedPanel>

          <AnimatedPanel open={deepResearchOpen} onClose={() => setDeepResearchOpen(false)} width={320} anchor="bottom-left"
            trigger={<div onClick={() => setDeepResearchOpen(true)} className={cmdClass}><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Users className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" /></div><div className="text-left"><p className="font-medium">Kunderesearch</p><p className="text-xs text-muted-foreground">Full analyse — relevans, konkurrenter og neste steg</p></div></div>}>
            <ResearchPanel title="Kunderesearch" agentName="customer_research_agent" label="Kunderesearch" companies={companies} onRun={runAgent} />
          </AnimatedPanel>

          <div onClick={runProjectAgent} className={cmdClass}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FolderCheck className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="font-medium">Sjekk faseoverganger</p>
              <p className="text-xs text-muted-foreground">Sjekker alle kunder og foreslår neste fase</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
