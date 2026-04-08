'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { createCompanySchema } from '@/lib/validators/company';
import { redirect } from 'next/navigation';

export type CreateCompanyState = {
  error?: Record<string, string[]>;
} | null;

export async function createCompany(
  _prevState: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createCompanySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const companyId = uuidv7();

  const { error: companyError } = await supabase.from('companies').insert({
    id: companyId,
    name: parsed.data.name,
    country: parsed.data.country,
    operational_area: parsed.data.operational_area || null,
    website: parsed.data.website || null,
    org_number: parsed.data.org_number || null,
    employee_count: parsed.data.employee_count || null,
    notes: parsed.data.notes || null,
    phase: 'lead',
  });

  if (companyError) {
    return { error: { _form: [companyError.message] } };
  }

  // Create primary contact if name provided
  if (parsed.data.contact_name) {
    await supabase.from('contacts').insert({
      id: uuidv7(),
      company_id: companyId,
      full_name: parsed.data.contact_name,
      email: parsed.data.contact_email || null,
      phone: parsed.data.contact_phone || null,
      role: parsed.data.contact_role || null,
      is_primary: true,
    });
  }

  redirect(`/customers/${companyId}`);
}

export async function updateCompanyPhase(companyId: string, newPhase: string) {
  const supabase = await createClient();

  // Validate phase transition (forward only, one step)
  const phases = ['lead', 'qualification', 'sales', 'onboarding', 'training', 'operational', 'finished'];

  const { data: company } = await supabase
    .from('companies')
    .select('phase')
    .eq('id', companyId)
    .single();

  if (!company) return { error: 'Kunde ikke funnet' };

  const currentIndex = phases.indexOf(company.phase);
  const newIndex = phases.indexOf(newPhase);

  if (newIndex !== currentIndex + 1) {
    return { error: 'Ugyldig faseovergang. Kun ett steg fremover om gangen.' };
  }

  const { error } = await supabase
    .from('companies')
    .update({ phase: newPhase })
    .eq('id', companyId);

  if (error) return { error: error.message };
  return { success: true };
}
