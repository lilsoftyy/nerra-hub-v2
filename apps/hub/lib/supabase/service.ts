import { createClient } from '@supabase/supabase-js';

/**
 * Service role Supabase client — bypasses RLS.
 * ONLY import from: api/agent/**, api/webhooks/**, api/cron/**, api/agent-auth/**, api/public/**
 * See CLAUDE.md section 5 for restrictions.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key);
}
