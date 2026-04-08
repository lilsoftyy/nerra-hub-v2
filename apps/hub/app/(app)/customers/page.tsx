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

const phaseLabels: Record<string, string> = {
  lead: 'Lead',
  qualification: 'Kvalifisering',
  sales: 'Salg',
  onboarding: 'Onboarding',
  training: 'Opplæring',
  operational: 'Operativ',
  finished: 'Ferdig',
};

const phaseColors: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  qualification: 'bg-blue-100 text-blue-800',
  sales: 'bg-yellow-100 text-yellow-800',
  onboarding: 'bg-purple-100 text-purple-800',
  training: 'bg-orange-100 text-orange-800',
  operational: 'bg-green-100 text-green-800',
  finished: 'bg-slate-100 text-slate-800',
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; phase?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('companies')
    .select('id, name, phase, country, created_at, assigned_to')
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
        <h2 className="text-2xl font-bold">Kunder</h2>
        <Link href="/customers/new">
          <Button>Opprett kunde</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <form className="flex-1">
          <Input
            name="search"
            placeholder="Søk etter firmanavn..."
            defaultValue={params.search ?? ''}
          />
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firmanavn</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Land</TableHead>
              <TableHead>Opprettet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies && companies.length > 0 ? (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${company.id}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={phaseColors[company.phase] ?? ''}>
                      {phaseLabels[company.phase] ?? company.phase}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.country}</TableCell>
                  <TableCell>
                    {new Date(company.created_at).toLocaleDateString('nb-NO')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Ingen kunder funnet. Klikk &quot;Opprett kunde&quot; for å legge til den første.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
