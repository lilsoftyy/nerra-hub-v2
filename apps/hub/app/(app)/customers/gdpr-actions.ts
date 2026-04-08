'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { redirect } from 'next/navigation';

export async function exportCustomerData(companyId: string) {
  const supabase = await createClient();

  // Fetch all related data
  const [company, contacts, dwaDetails, economy, documents, contracts, activities, checklist] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('contacts').select('*').eq('company_id', companyId),
    supabase.from('customer_dwa_details').select('*').eq('company_id', companyId).single(),
    supabase.from('customer_economy').select('*').eq('company_id', companyId).single(),
    supabase.from('documents').select('*').eq('company_id', companyId),
    supabase.from('contracts').select('*').eq('company_id', companyId),
    supabase.from('activity_log').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('phase_checklist_items').select('*').eq('company_id', companyId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    company: company.data,
    contacts: contacts.data ?? [],
    dwa_details: dwaDetails.data,
    economy: economy.data,
    documents: documents.data ?? [],
    contracts: contracts.data ?? [],
    activity_log: activities.data ?? [],
    phase_checklist: checklist.data ?? [],
  };
}

export async function deleteCustomerData(companyId: string) {
  const supabase = await createClient();

  // Get company name for GDPR log before deletion
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  if (!company) {
    return { error: 'Kunde ikke funnet' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Delete company (cascade handles contacts, dwa_details, economy, documents, contracts, checklist, activity_log)
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) {
    return { error: `Sletting feilet: ${error.message}` };
  }

  // Log to GDPR deletions table
  await supabase.from('gdpr_deletions').insert({
    id: uuidv7(),
    company_name: company.name,
    reason: 'manual',
    triggered_by: user?.id ?? null,
  });

  redirect('/customers');
}
