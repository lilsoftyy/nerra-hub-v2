'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/toast-provider';

interface AgentTriggerButtonProps {
  agent: string;
  label: string;
  companyId?: string;
  companyName?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function AgentTriggerButton({ agent, label, companyId, companyName, variant = 'outline', size = 'sm' }: AgentTriggerButtonProps) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    const toastId = addToast({
      type: 'loading',
      title: `${label}${companyName ? ` — ${companyName}` : ''}`,
      description: 'Agenten jobber...',
    });

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, company_id: companyId }),
      });
      const data = await res.json();

      if (data.error) {
        updateToast(toastId, {
          type: 'error',
          title: 'Feil',
          description: data.error,
        });
      } else if (data.document_id) {
        updateToast(toastId, {
          type: 'success',
          title: `${label} ferdig`,
          description: companyName ?? 'Rapport opprettet',
          action: {
            label: 'Se rapport',
            onClick: () => router.push(`/documents/${data.document_id}`),
          },
        });
      } else if (data.proposals_created !== undefined) {
        updateToast(toastId, {
          type: 'success',
          title: `${label} ferdig`,
          description: `${data.proposals_created} forslag opprettet`,
        });
      } else {
        updateToast(toastId, {
          type: 'success',
          title: `${label} ferdig`,
        });
      }
      router.refresh();
    } catch {
      updateToast(toastId, {
        type: 'error',
        title: 'Noe gikk galt',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant={variant} size={size}>
      {loading ? 'Kjører...' : label}
    </Button>
  );
}
