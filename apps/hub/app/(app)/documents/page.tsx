import { createClient } from '@/lib/supabase/server';
import { DocumentsList } from '@/components/documents/documents-list';

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, kind, created_at, company_id, companies(name)')
    .order('created_at', { ascending: false });

  const docs = (documents ?? []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    created_at: doc.created_at,
    company_name: (doc.companies as unknown as { name: string } | null)?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dokumenter</h1>
        <a
          href="https://nerra-qualification.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground transition-[color] duration-150 hover:text-foreground"
        >
          Kvalifiseringsskjema
        </a>
      </div>
      <DocumentsList documents={docs} />
    </div>
  );
}
