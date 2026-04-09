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
import { Plus } from 'lucide-react';

const potentialCustomerPhases = ['lead', 'qualification', 'sales', 'onboarding', 'training'];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; phase?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('companies')
    .select('id, name, phase, country, created_at, contacts(full_name, role)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  if (params.phase) {
    query = query.eq('phase', params.phase);
  }

  const { data: companies } = await query;

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
          placeholder="Søk etter navn eller selskap..."
          defaultValue={params.search ?? ''}
          className="max-w-sm"
        />
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Selskap</TableHead>
              <TableHead>Kontaktperson</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Land</TableHead>
              <TableHead>Opprettet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies && companies.length > 0 ? (
              companies.map((company) => {
                const contacts = company.contacts as unknown as Array<{ full_name: string; role?: string }> ?? [];
                const primary = contacts[0];
                const isPotentialCustomer = potentialCustomerPhases.includes(company.phase);

                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${company.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {primary ? (
                        <div>
                          <p className="text-sm">{primary.full_name}</p>
                          {primary.role && <p className="text-xs text-muted-foreground">{primary.role}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ingen kontakt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isPotentialCustomer ? (
                        <Badge className="bg-primary/10 text-primary text-[10px]">
                          Potensiell kunde
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Kontakt
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.country}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(company.created_at))}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Ingen personer funnet. Bruk &quot;AI-søk&quot; for å legge til den første.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
