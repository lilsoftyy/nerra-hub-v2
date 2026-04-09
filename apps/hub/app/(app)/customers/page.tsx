import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AIContactLookup } from '@/components/customers/ai-contact-lookup';
import { PersonEditButton } from '@/components/customers/person-edit-button';
import { Plus } from 'lucide-react';
import { formatShortDate } from '@/lib/formatters';

const potentialCustomerPhases = ['lead', 'qualification', 'sales', 'onboarding', 'training'];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Hent alle kontakter med selskapsinfo
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, role, is_primary, company_id, companies(id, name, phase, country, created_at)')
    .order('created_at', { ascending: false });

  // Filtrer på søk
  let filtered = contacts ?? [];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((c) => {
      const company = c.companies as unknown as { name: string } | null;
      return c.full_name.toLowerCase().includes(q) || company?.name.toLowerCase().includes(q);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Personer</h1>
        <div className="flex items-center gap-2">
          <AIContactLookup />
          <Button size="sm" variant="outline" render={<Link href="/customers/new" />}>
            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Manuelt
          </Button>
        </div>
      </div>

      <form>
        <Input
          name="search"
          placeholder="Søk..."
          defaultValue={params.search ?? ''}
          className="max-w-sm"
        />
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Selskap</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Land</TableHead>
              <TableHead>Opprettet</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((contact) => {
                const company = contact.companies as unknown as { id: string; name: string; phase: string; country: string; created_at: string } | null;
                const isPotentialCustomer = company ? potentialCustomerPhases.includes(company.phase) : false;

                return (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{contact.full_name}</p>
                        {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company ? (
                        <Link
                          href={`/customers/${company.id}`}
                          className="text-sm hover:underline"
                        >
                          {company.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isPotentialCustomer ? (
                        <Badge className="bg-primary/10 text-primary text-[10px]">
                          Kunde
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Kontakt
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company?.country ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company ? formatShortDate(company.created_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <PersonEditButton
                        contactId={contact.id}
                        fullName={contact.full_name}
                        email={contact.email}
                        phone={contact.phone}
                        role={contact.role}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Ingen personer funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
