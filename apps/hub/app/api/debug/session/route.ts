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
    refreshTokenPreview: session?.provider_refresh_token ? session.provider_refresh_token.slice(0, 10) + '...' : null,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    hint: !session?.provider_refresh_token
      ? 'Ingen refresh token. Logg ut, logg inn igjen — du vil bli bedt om å gi tilgang på nytt.'
      : 'Refresh token finnes. Gmail og Calendar bør fungere.',
  });
}
