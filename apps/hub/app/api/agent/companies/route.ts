import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent, requireScope } from '@/lib/agent-auth/middleware';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const auth = authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'companies:read');
  if (scopeError) return scopeError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, phase, country, flagged, assigned_to, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies: data });
}
