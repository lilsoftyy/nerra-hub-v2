'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { useToast } from '@/components/shared/toast-provider';
import { saveDocumentEdit } from '@/app/(app)/documents/[documentId]/actions';
import { Pencil, Eye, Save, Loader2 } from 'lucide-react';

interface DocumentEditorProps {
  documentId: string;
  content: string;
  isGenerated: boolean;
}

/** Convert HTML from contentEditable back to markdown */
function htmlToMarkdown(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childText = Array.from(el.childNodes).map(processNode).join('');

    switch (tag) {
      case 'h1': return `# ${childText}\n\n`;
      case 'h2': return `## ${childText}\n\n`;
      case 'h3': return `### ${childText}\n\n`;
      case 'h4': return `#### ${childText}\n\n`;
      case 'p': return `${childText}\n\n`;
      case 'strong': case 'b': return `**${childText}**`;
      case 'em': case 'i': return `*${childText}*`;
      case 'ul': return `${childText}\n`;
      case 'ol': return `${childText}\n`;
      case 'li': {
        const parent = el.parentElement?.tagName.toLowerCase();
        const prefix = parent === 'ol'
          ? `${Array.from(el.parentElement!.children).indexOf(el) + 1}. `
          : '- ';
        return `${prefix}${childText}\n`;
      }
      case 'blockquote': return `> ${childText.trim()}\n\n`;
      case 'hr': return `---\n\n`;
      case 'br': return '\n';
      case 'a': {
        const href = el.getAttribute('href');
        return href ? `[${childText}](${href})` : childText;
      }
      case 'code': {
        if (el.parentElement?.tagName.toLowerCase() === 'pre') return childText;
        return `\`${childText}\``;
      }
      case 'pre': return `\`\`\`\n${childText}\n\`\`\`\n\n`;
      case 'div': case 'article': case 'section': return childText;
      default: return childText;
    }
  }

  const result = processNode(div)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}

export function DocumentEditor({ documentId, content, isGenerated }: DocumentEditorProps) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    setSaving(true);

    // Konverter HTML tilbake til markdown
    const editedMarkdown = htmlToMarkdown(editorRef.current.innerHTML);
    setText(editedMarkdown);

    const toastId = addToast({ type: 'loading', title: 'Lagrer endringer...' });

    const result = await saveDocumentEdit(documentId, editedMarkdown);
    if (result.error) {
      updateToast(toastId, { type: 'error', title: 'Feil', description: result.error });
    } else {
      updateToast(toastId, {
        type: 'success',
        title: 'Lagret',
        description: 'Agenten lærer av endringene dine',
      });
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }, [documentId, addToast, updateToast, router]);

  return (
    <div>
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
            {editing && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
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

      {editing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="mx-auto rounded-xl ring-1 ring-primary/20 px-6 py-4 outline-none focus:ring-primary/40"
          style={{ maxWidth: '700px', fontSize: '14.5px', lineHeight: 1.75 }}
        >
          <MarkdownContent content={text} />
        </div>
      ) : (
        <MarkdownContent content={text} />
      )}
    </div>
  );
}
