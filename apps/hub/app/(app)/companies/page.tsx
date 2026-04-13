import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { phaseLabels } from '@/lib/labels';
import { phaseDotColors } from '@/lib/constants';
import { CompanyRowActions } from '@/components/companies/company-row-actions';
import { ClickableRow } from '@/components/shared/clickable-row';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('companies')
    .select('id, name, phase, country, website, employee_count, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  const { data: companies } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Firma</h1>
        <span className="text-sm text-muted-foreground tabular-nums">{companies?.length ?? 0}</span>
      </div>

      <form>
        <Input
          name="search"
          placeholder="Søk etter firma..."
          defaultValue={params.search ?? ''}
          className="max-w-sm"
        />
      </form>

      <div className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Land</TableHead>
              <TableHead>Ansatte</TableHead>
              <TableHead>Nettside</TableHead>
              <TableHead>Opprettet</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies && companies.length > 0 ? (
              companies.map((company) => {
                return (
                  <ClickableRow key={company.id} href={`/customers/${company.id}`} className="transition-[background-color] duration-150 hover:bg-primary/[0.04]">
                    <TableCell>
                      <Link href={`/customers/${company.id}`} className="text-sm font-medium hover:text-primary transition-[color] duration-150">
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${phaseDotColors[company.phase] ?? 'bg-neutral-400'}`} aria-hidden="true" />
                        <span className="text-sm">{phaseLabels[company.phase] ?? company.phase}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.country}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {company.employee_count ?? '—'}
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(company.created_at))}
                    </TableCell>
                    <TableCell>
                      <CompanyRowActions companyId={company.id} companyName={company.name} />
                    </TableCell>
                  </ClickableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Ingen firma funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
