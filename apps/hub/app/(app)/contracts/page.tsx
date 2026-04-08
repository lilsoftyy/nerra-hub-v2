import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
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

export default async function ContractsPage() {
  const supabase = await createClient();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, status, total_amount, currency, valid_until, sent_at, signed_at, company_id, companies(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kontrakter</h2>
      </div>

      <div className="rounded-md border">
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
                  <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50">
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
                      {contract.total_amount != null
                        ? `${contract.total_amount.toLocaleString('nb-NO')} ${contract.currency ?? 'NOK'}`
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
                  </TableRow>
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
