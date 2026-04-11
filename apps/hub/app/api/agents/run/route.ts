import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runProjectAgent } from '@/lib/agents/project-agent';
import { runResearchAgent } from '@/lib/agents/research-agent';
import { runCustomerResearchAgent } from '@/lib/agents/customer-research-agent';
import { runLeadResearchAgent } from '@/lib/agents/lead-research-agent';

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email?.endsWith('@nerra.no')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { agent, company_id, country } = body as { agent: string; company_id?: string; country?: string };

  try {
    switch (agent) {
      case 'agent_3_project': {
        const result = await runProjectAgent();
        return NextResponse.json(result);
      }
      case 'agent_6_lead_research': {
        if (!company_id) {
          return NextResponse.json({ error: 'company_id er påkrevd for research-agenten' }, { status: 400 });
        }
        const result = await runResearchAgent(company_id);
        return NextResponse.json(result);
      }
      case 'customer_research_agent': {
        if (!company_id) {
          return NextResponse.json({ error: 'company_id er påkrevd for kunderesearch-agenten' }, { status: 400 });
        }
        const result = await runCustomerResearchAgent(company_id, supabase);
        return NextResponse.json(result);
      }
      case 'lead_research_agent': {
        if (!country) {
          return NextResponse.json({ error: 'country er påkrevd for lead research' }, { status: 400 });
        }
        const result = await runLeadResearchAgent(country);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: `Ukjent agent: ${agent}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukjent feil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
