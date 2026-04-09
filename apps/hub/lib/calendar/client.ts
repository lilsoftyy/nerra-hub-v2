import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function getCalendarClient() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: session.provider_token,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
