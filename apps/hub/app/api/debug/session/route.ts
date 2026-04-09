import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return NextResponse.json({
    hasSession: !!session,
    hasProviderToken: !!session?.provider_token,
    hasProviderRefreshToken: !!session?.provider_refresh_token,
    userEmail: session?.user?.email ?? null,
    tokenPreview: session?.provider_token ? session.provider_token.slice(0, 20) + '...' : null,
  });
}
