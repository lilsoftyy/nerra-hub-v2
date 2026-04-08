import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { documentKindLabels, documentVisibilityLabels } from '@/lib/labels';
import Link from 'next/link';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('*, companies(name)')
    .eq('id', documentId)
    .single();

  if (!doc) notFound();

  const company = doc.companies as unknown as { name: string } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{doc.title}</h2>
        <div className="flex items-center gap-3 mt-1">
          <Badge variant="secondary">
            {documentKindLabels[doc.kind] ?? doc.kind}
          </Badge>
          <Badge variant="outline">
            {documentVisibilityLabels[doc.visibility] ?? doc.visibility}
          </Badge>
          {company && (
            <Link href={`/customers/${doc.company_id}`} className="text-sm text-muted-foreground hover:underline">
              {company.name}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {new Date(doc.created_at).toLocaleDateString('nb-NO')}
          </span>
        </div>
        {doc.summary && (
          <p className="mt-2 text-muted-foreground">{doc.summary}</p>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {doc.content_markdown ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {doc.content_markdown}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen innhold tilgjengelig.</p>
          )}
        </CardContent>
      </Card>

      {doc.generated_by_agent && (
        <p className="text-xs text-muted-foreground">
          Generert av {doc.generated_by_agent}
        </p>
      )}
    </div>
  );
}
