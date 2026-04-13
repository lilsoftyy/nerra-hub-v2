import { createClient } from '@/lib/supabase/server';
import { AIContactLookup } from '@/components/customers/ai-contact-lookup';
import { ManualAddDialog } from '@/components/customers/manual-add-dialog';
import { PersonsList } from '@/components/customers/persons-list';

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, role, is_primary, contact_type, company_id, companies(id, name, phase, country)')
    .order('created_at', { ascending: false });

  const persons = (contacts ?? []).map((c) => {
    const company = c.companies as unknown as { id: string; name: string; phase: string; country: string } | null;
    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      company_id: company?.id ?? null,
      company_name: company?.name ?? null,
      company_phase: company?.phase ?? null,
      company_country: company?.country ?? null,
      contact_type: (c as Record<string, unknown>).contact_type as string ?? 'contact',
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Personer</h1>
          <span className="text-sm text-muted-foreground tabular-nums">{persons.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <AIContactLookup />
          <ManualAddDialog />
        </div>
      </div>

      <PersonsList persons={persons} />
    </div>
  );
}
