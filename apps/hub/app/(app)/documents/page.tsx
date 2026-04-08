import { createClient } from '@/lib/supabase/server';
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
  documentKindLabels,
  documentVisibilityLabels,
} from '@/lib/labels';

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, kind, visibility, created_at, company_id, companies(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dokumenter</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Synlighet</TableHead>
              <TableHead>Opprettet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => {
                const company = doc.companies as unknown as { name: string } | null;
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {documentKindLabels[doc.kind] ?? doc.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company?.name ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          doc.visibility === 'customer_shareable'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {documentVisibilityLabels[doc.visibility] ?? doc.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('nb-NO')}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Ingen dokumenter funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
