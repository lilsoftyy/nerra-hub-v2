import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent, requireScope } from '@/lib/agent-auth/middleware';
import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  category: z.enum(['sales', 'training', 'admin', 'development', 'research', 'other']).optional(),
  company_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const auth = authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'tasks:write');
  if (scopeError) return scopeError;

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.from('tasks').insert({
    id: uuidv7(),
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    category: parsed.data.category ?? null,
    company_id: parsed.data.company_id ?? null,
    due_date: parsed.data.due_date ?? null,
    created_by_agent: auth.agentName,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'tasks:write');
  if (scopeError) return scopeError;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const companyId = searchParams.get('company_id');

  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data });
}
