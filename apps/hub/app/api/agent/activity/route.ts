import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent, requireScope } from '@/lib/agent-auth/middleware';
import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

const logActivitySchema = z.object({
  action: z.string().min(1),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'activity:write');
  if (scopeError) return scopeError;

  const body = await request.json();
  const parsed = logActivitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'agent',
    actor_name: auth.agentName,
    action: parsed.data.action,
    entity_type: parsed.data.entity_type ?? null,
    entity_id: parsed.data.entity_id ?? null,
    company_id: parsed.data.company_id ?? null,
    details: parsed.data.details ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
