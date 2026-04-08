import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface ContractDetailPageProps {
  params: Promise<{ contractId: string }>;
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { contractId } = await params;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, companies(name)')
    .eq('id', contractId)
    .single();

  if (!contract) {
    notFound();
  }

  const { data: views } = await supabase
    .from('contract_views')
    .select('id, viewed_at, user_agent')
    .eq('contract_id', contractId)
    .order('viewed_at', { ascending: false });

  const company = contract.companies as unknown as { name: string } | null;
  const packages = contract.packages as unknown as Array<{ name: string; price: number }> | null;
  const publicUrl = contract.public_slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hub.nerra.no'}/c/${contract.public_slug}`
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{company?.name ?? 'Ukjent kunde'}</h2>
        <Badge className={contractStatusColors[contract.status] ?? ''}>
          {contractStatusLabels[contract.status] ?? contract.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pakker og priser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {packages && packages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pakke</TableHead>
                  <TableHead className="text-right">Pris</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg, index) => (
                  <TableRow key={index}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell className="text-right">
                      {pkg.price.toLocaleString('nb-NO')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Ingen pakker definert.</p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
            {contract.subtotal != null && (
              <div>
                <span className="text-muted-foreground">Subtotal:</span>{' '}
                {contract.subtotal.toLocaleString('nb-NO')}
              </div>
            )}
            {contract.adjustment != null && contract.adjustment !== 0 && (
              <div>
                <span className="text-muted-foreground">Justering:</span>{' '}
                {contract.adjustment.toLocaleString('nb-NO')}
              </div>
            )}
            {contract.total_amount != null && (
              <div className="font-semibold">
                <span className="text-muted-foreground">Total:</span>{' '}
                {contract.total_amount.toLocaleString('nb-NO')} {contract.currency ?? 'NOK'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Gyldig til</dt>
              <dd>
                {contract.valid_until
                  ? new Date(contract.valid_until).toLocaleDateString('nb-NO')
                  : '-'}
              </dd>
            </div>
            {publicUrl && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Offentlig URL</dt>
                <dd className="font-mono text-xs break-all">{publicUrl}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Sendt</dt>
              <dd>
                {contract.sent_at
                  ? new Date(contract.sent_at).toLocaleString('nb-NO')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sett</dt>
              <dd>
                {contract.viewed_at
                  ? new Date(contract.viewed_at).toLocaleString('nb-NO')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Signert</dt>
              <dd>
                {contract.signed_at
                  ? new Date(contract.signed_at).toLocaleString('nb-NO')
                  : '-'}
              </dd>
            </div>
            {contract.signed_by_name && (
              <div>
                <dt className="text-muted-foreground">Signert av</dt>
                <dd>{contract.signed_by_name}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visningslogg</CardTitle>
        </CardHeader>
        <CardContent>
          {views && views.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tidspunkt</TableHead>
                  <TableHead>Nettleser</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {views.map((view) => (
                  <TableRow key={view.id}>
                    <TableCell>
                      {new Date(view.viewed_at).toLocaleString('nb-NO')}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {view.user_agent
                        ? view.user_agent.length > 80
                          ? `${view.user_agent.slice(0, 80)}...`
                          : view.user_agent
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Ingen visninger registrert.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
