'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <article className="max-w-none text-sm leading-6 text-foreground">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mt-5 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-5 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-4 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-6">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-muted-foreground/30 pl-3 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-border" />,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted rounded-lg p-3 my-3 overflow-x-auto text-xs">{children}</pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
