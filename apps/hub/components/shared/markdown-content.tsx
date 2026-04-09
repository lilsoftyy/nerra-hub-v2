'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

function cleanContent(raw: string): string {
  return raw
    .replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, '')
    .replace(/\u200B/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\n\n\.\s*\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const cleaned = cleanContent(content);

  return (
    <article className="max-w-none text-[14px] leading-[1.6] text-foreground">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-[17px] font-semibold mt-4 mb-1.5 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[15px] font-semibold mt-4 mb-1 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[14px] font-semibold mt-3 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[14px] font-semibold mt-2 mb-0.5">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li>{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted rounded p-3 my-2 overflow-x-auto text-xs">{children}</pre>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </article>
  );
}
