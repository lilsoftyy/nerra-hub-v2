'use server';

import { createClient } from '@/lib/supabase/server';
import { v7 as uuidv7 } from 'uuid';
import { createCompanySchema } from '@/lib/validators/company';
import { redirect } from 'next/navigation';
import { PHASES } from '@/lib/constants';

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
  const { data: company } = await supabase
    .from('companies')
    .select('phase')
    .eq('id', companyId)
    .single();

  if (!company) return { error: 'Kunde ikke funnet' };

  const phases = PHASES as readonly string[];
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

export async function updateCompany(companyId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  if (!name) return { error: 'Firmanavn er påkrevd' };

  const { error } = await supabase
    .from('companies')
    .update({
      name,
      country: (formData.get('country') as string) || undefined,
      operational_area: (formData.get('operational_area') as string) || null,
      website: (formData.get('website') as string) || null,
      org_number: (formData.get('org_number') as string) || null,
      employee_count: formData.get('employee_count') ? Number(formData.get('employee_count')) : null,
      facade_team_size: formData.get('facade_team_size') ? Number(formData.get('facade_team_size')) : null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', companyId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addContact(companyId: string, formData: FormData) {
  const supabase = await createClient();

  const fullName = formData.get('full_name') as string;
  if (!fullName) return { error: 'Navn er påkrevd' };

  // Check if this is the first contact (make primary)
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);

  const isPrimary = !existing || existing.length === 0;

  const { error } = await supabase.from('contacts').insert({
    id: uuidv7(),
    company_id: companyId,
    full_name: fullName,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role: (formData.get('role') as string) || null,
    is_primary: isPrimary,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createClient();

  const fullName = formData.get('full_name') as string;
  if (!fullName) return { error: 'Navn er påkrevd' };

  const { error } = await supabase
    .from('contacts')
    .update({
      full_name: fullName,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      role: (formData.get('role') as string) || null,
    })
    .eq('id', contactId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createContactFromLookup(data: {
  person_name: string;
  person_email: string | null;
  person_role: string | null;
  person_phone: string | null;
  person_linkedin?: string | null;
  company_name: string;
  company_country: string | null;
  company_website: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_employee_count: number | null;
  company_description: string | null;
  company_operational_area: string | null;
  is_potential_customer: boolean;
}) {
  const supabase = await createClient();
  const companyId = uuidv7();

  const { error: companyError } = await supabase.from('companies').insert({
    id: companyId,
    name: data.company_name,
    country: data.company_country || 'NO',
    website: data.company_website || null,
    employee_count: data.company_employee_count || null,
    operational_area: data.company_operational_area || null,
    notes: [data.company_description, data.company_email ? `E-post: ${data.company_email}` : null, data.company_phone ? `Tlf: ${data.company_phone}` : null].filter(Boolean).join('\n') || null,
    phase: data.is_potential_customer ? 'lead' : 'operational',
  });

  if (companyError) return { error: companyError.message };

  await supabase.from('contacts').insert({
    id: uuidv7(),
    company_id: companyId,
    full_name: data.person_name,
    email: data.person_email || null,
    phone: data.person_phone || null,
    role: data.person_role || null,
    is_primary: true,
  });

  await supabase.from('activity_log').insert({
    id: uuidv7(),
    actor_type: 'human',
    action: 'contact.created_via_ai_lookup',
    entity_type: 'company',
    entity_id: companyId,
    company_id: companyId,
    details: {
      person: data.person_name,
      company: data.company_name,
      is_potential_customer: data.is_potential_customer,
    },
  });

  return { success: true, companyId };
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) return { error: error.message };
  return { success: true };
}
