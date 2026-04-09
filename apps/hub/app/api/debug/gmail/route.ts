import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Ingen sesjon', step: 'session' });
  }

  const accessToken = session.provider_token;
  const refreshToken = session.provider_refresh_token;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'Ingen provider_token eller refresh_token', step: 'token' });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'Mangler GOOGLE_OAUTH_CLIENT_ID eller GOOGLE_OAUTH_CLIENT_SECRET',
      step: 'env',
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      access_token: accessToken ?? undefined,
      refresh_token: refreshToken ?? undefined,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
      labelIds: ['INBOX'],
    });

    return NextResponse.json({
      success: true,
      messageCount: response.data.resultSizeEstimate ?? 0,
      firstMessageId: response.data.messages?.[0]?.id ?? null,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; errors?: unknown[] };
    return NextResponse.json({
      error: error.message ?? 'Ukjent feil',
      code: error.code ?? null,
      details: error.errors ?? null,
      step: 'gmail_api',
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
  }
}
