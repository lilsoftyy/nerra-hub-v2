import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent, requireScope } from '@/lib/agent-auth/middleware';
import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

const createProposalSchema = z.object({
  action_type: z.enum([
    'phase_transition', 'task_creation', 'customer_update',
    'calendar_event', 'email_draft', 'document_generation',
    'welcome_package', 'bug_fix', 'other',
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  company_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  reversible: z.boolean().optional().default(true),
  irreversible_warning: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const auth = authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'proposals:write');
  if (scopeError) return scopeError;

  const body = await request.json();
  const parsed = createProposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check for backward phase transitions from agents (spec 6.5.5)
  if (parsed.data.action_type === 'phase_transition' && parsed.data.payload) {
    const phases = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];
    const fromIdx = phases.indexOf(String(parsed.data.payload.from_phase));
    const toIdx = phases.indexOf(String(parsed.data.payload.to_phase));
    if (fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx) {
      return NextResponse.json(
        { error: 'agents_cannot_propose_backward_transitions' },
        { status: 403 },
      );
    }
  }

  const supabase = await createClient();
  const proposalId = uuidv7();

  const { data, error } = await supabase.from('proposals').insert({
    id: proposalId,
    agent_name: auth.agentName,
    action_type: parsed.data.action_type,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    payload: parsed.data.payload,
    company_id: parsed.data.company_id ?? null,
    task_id: parsed.data.task_id ?? null,
    reversible: parsed.data.reversible,
    irreversible_warning: parsed.data.irreversible_warning ?? null,
    expires_at: parsed.data.expires_at ?? null,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
