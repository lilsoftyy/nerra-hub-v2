import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AIContactLookup } from '@/components/customers/ai-contact-lookup';
import { PersonsList } from '@/components/customers/persons-list';
import { Plus } from 'lucide-react';

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, role, is_primary, company_id, companies(id, name, phase, country)')
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
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Personer</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/50">Legg til ny:</span>
          <div className="flex items-center gap-2">
            <AIContactLookup />
            <Button size="sm" variant="outline" render={<Link href="/customers/new" />}>
              <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Manuelt
            </Button>
          </div>
        </div>
      </div>

      <PersonsList persons={persons} />
    </div>
  );
}
