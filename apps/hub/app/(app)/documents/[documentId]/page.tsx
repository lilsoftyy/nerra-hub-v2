import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { documentKindLabels, documentVisibilityLabels } from '@/lib/labels';
import Link from 'next/link';
import { DocumentEditor } from '@/components/documents/document-editor';
import { DocumentActions } from '@/components/documents/document-actions';

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
  const isGenerated = !!doc.generated_by_agent;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
        <DocumentActions documentId={doc.id} title={doc.title} />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-3 mt-1">
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
          {doc.edited_at && (
            <span className="text-xs text-muted-foreground">
              Redigert {new Date(doc.edited_at).toLocaleDateString('nb-NO')}
            </span>
          )}
        </div>
      </div>

      <DocumentEditor
        documentId={doc.id}
        content={doc.content_markdown ?? ''}
        isGenerated={isGenerated}
      />

      {isGenerated && (
        <p className="text-xs text-muted-foreground">
          Generert av {doc.generated_by_agent}
        </p>
      )}
    </div>
  );
}
