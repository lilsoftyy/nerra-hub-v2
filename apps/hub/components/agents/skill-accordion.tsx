'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { ChevronRight } from 'lucide-react';

interface SkillAccordionProps {
  name: string;
  label: string;
  description: string;
  filename: string;
  content: string;
}

export function SkillAccordion({ label, description, filename, content }: SkillAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-[background-color] duration-150 hover:bg-muted/30"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <Badge variant="outline" className="text-[10px]">{filename}</Badge>
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t px-4 py-4">
          <MarkdownContent content={content} />
        </div>
      )}
    </div>
  );
}
