import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Soft-delete aware query helpers.
 * All application code MUST use these instead of direct Supabase calls
 * against soft-deletable tables. See CLAUDE.md section 5.
 */

export function activeCompanies(supabase: SupabaseClient) {
  return supabase.from('companies').select().is('deleted_at', null);
}

export function activeContacts(supabase: SupabaseClient) {
  return supabase.from('contacts').select().is('deleted_at', null);
}
