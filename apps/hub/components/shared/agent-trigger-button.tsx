'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AgentTriggerButtonProps {
  agent: string;
  label: string;
  companyId?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function AgentTriggerButton({ agent, label, companyId, variant = 'outline', size = 'sm' }: AgentTriggerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, company_id: companyId }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`Feil: ${data.error}`);
      } else if (data.proposals_created !== undefined) {
        setResult(`Ferdig. ${data.proposals_created} forslag opprettet.`);
        router.refresh();
      } else if (data.document_id) {
        setResult('Research-dokument opprettet.');
        router.refresh();
      } else {
        setResult('Ferdig.');
        router.refresh();
      }
    } catch {
      setResult('Noe gikk galt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} variant={variant} size={size}>
        {loading ? 'Kjører...' : label}
      </Button>
      {result && <p className="text-sm text-muted-foreground mt-1">{result}</p>}
    </div>
  );
}
