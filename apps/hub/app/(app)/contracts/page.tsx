import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ClickableRow } from '@/components/shared/clickable-row';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  contractStatusLabels,
  contractStatusColors,
} from '@/lib/labels';
import { NewContractButton } from '@/components/contracts/new-contract-button';

export default async function ContractsPage() {
  const supabase = await createClient();

  const [contractsResult, companiesResult] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, status, total, currency, valid_until, sent_at, signed_at, company_id, companies(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('companies')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const contracts = contractsResult.data;
  const companies = (companiesResult.data ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Kontrakter</h1>
        <NewContractButton companies={companies} />
      </div>

      {/* Mobilvisning */}
      <div className="space-y-2 md:hidden">
        {contracts && contracts.length > 0 ? (
          contracts.map((contract) => {
            const company = contract.companies as unknown as { name: string } | null;
            return (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="block rounded-xl border p-3 transition-[background-color] duration-150 active:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{company?.name ?? '-'}</p>
                  <Badge className={contractStatusColors[contract.status] ?? ''}>
                    {contractStatusLabels[contract.status] ?? contract.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {contract.total != null && (
                    <span>{contract.total.toLocaleString('nb-NO')} {contract.currency ?? 'NOK'}</span>
                  )}
                  {contract.valid_until && (
                    <span>Gyldig til {new Date(contract.valid_until).toLocaleDateString('nb-NO')}</span>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">Ingen kontrakter.</p>
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kunde</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Gyldig til</TableHead>
              <TableHead>Sendt</TableHead>
              <TableHead>Signert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts && contracts.length > 0 ? (
              contracts.map((contract) => {
                const company = contract.companies as unknown as { name: string } | null;
                return (
                  <ClickableRow key={contract.id} href={`/contracts/${contract.id}`} className="cursor-pointer transition-[background-color] duration-150 hover:bg-primary/[0.04]">
                    <TableCell>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="font-medium hover:underline"
                      >
                        {company?.name ?? '-'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={contractStatusColors[contract.status] ?? ''}>
                        {contractStatusLabels[contract.status] ?? contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.total != null
                        ? `${contract.total.toLocaleString('nb-NO')} ${contract.currency ?? 'NOK'}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.valid_until
                        ? new Date(contract.valid_until).toLocaleDateString('nb-NO')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.sent_at
                        ? new Date(contract.sent_at).toLocaleDateString('nb-NO')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.signed_at
                        ? new Date(contract.signed_at).toLocaleDateString('nb-NO')
                        : '-'}
                    </TableCell>
                  </ClickableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Ingen kontrakter funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
