import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function getGmailClient() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const accessToken = session?.provider_token;
  const refreshToken = session?.provider_refresh_token;

  if (!refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: accessToken ?? undefined,
    refresh_token: refreshToken,
  });

  // Refresh token proaktivt hvis access token mangler eller kan være utløpt
  if (!accessToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch {
      return null;
    }
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}
