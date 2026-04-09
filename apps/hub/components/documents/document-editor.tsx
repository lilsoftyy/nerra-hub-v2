'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { saveDocumentEdit } from '@/app/(app)/documents/[documentId]/actions';
import { Pencil, Eye, Save, Loader2 } from 'lucide-react';

interface DocumentEditorProps {
  documentId: string;
  content: string;
  isGenerated: boolean;
}

export function DocumentEditor({ documentId, content, isGenerated }: DocumentEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveDocumentEdit(documentId, text);
    if (result.error) alert(result.error);
    else {
      setSaved(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Toolbar */}
      {isGenerated && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-[color,background-color] duration-150 ${!editing ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Eye className="size-3" strokeWidth={1.75} aria-hidden="true" />
              Vis
            </button>
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-[color,background-color] duration-150 ${editing ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Pencil className="size-3" strokeWidth={1.75} aria-hidden="true" />
              Rediger
            </button>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-600">Lagret — agenten lærer av endringene</span>}
            {editing && (
              <Button size="sm" onClick={handleSave} disabled={saving || text === content}>
                {saving ? (
                  <><Loader2 className="size-3.5 animate-spin" aria-hidden="true" />Lagrer...</>
                ) : (
                  <><Save className="size-3.5" strokeWidth={1.75} aria-hidden="true" />Lagre</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[500px] rounded-xl border border-input bg-transparent px-5 py-4 text-sm font-mono leading-relaxed outline-none resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ) : (
        <MarkdownContent content={text} />
      )}
    </div>
  );
}
