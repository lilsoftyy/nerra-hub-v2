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
    <div className="mx-auto" style={{ maxWidth: '700px' }}>
      <article
        className="text-foreground/90"
        style={{ fontSize: '14.5px', lineHeight: 1.75 }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1
                className="first:mt-0"
                style={{ fontSize: '20px', fontWeight: 500, marginTop: '2em', marginBottom: '0.6em' }}
              >
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2
                className="first:mt-0"
                style={{ fontSize: '16px', fontWeight: 500, marginTop: '1.8em', marginBottom: '0.5em' }}
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                style={{ fontSize: '14.5px', fontWeight: 500, marginTop: '1.5em', marginBottom: '0.4em' }}
              >
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4
                style={{ fontSize: '14.5px', fontWeight: 500, marginTop: '1.2em', marginBottom: '0.3em' }}
              >
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p style={{ marginBottom: '0.9em' }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{ marginBottom: '0.9em', paddingLeft: '1.4em', listStyleType: 'disc' }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol style={{ marginBottom: '0.9em', paddingLeft: '1.4em', listStyleType: 'decimal' }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: '0.25em' }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 500 }}>{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className="text-foreground/60 italic"
                style={{
                  borderLeft: '2px solid currentColor',
                  opacity: 0.4,
                  paddingLeft: '1em',
                  marginTop: '1em',
                  marginBottom: '1em',
                }}
              >
                {children}
              </blockquote>
            ),
            hr: () => (
              <hr
                className="border-foreground/10"
                style={{ marginTop: '2em', marginBottom: '2em', borderTopWidth: '0.5px' }}
              />
            ),
            code: ({ children }) => (
              <code
                className="bg-foreground/5"
                style={{ fontSize: '13px', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}
              >
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre
                className="bg-foreground/5"
                style={{
                  fontSize: '13px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  marginTop: '1em',
                  marginBottom: '1em',
                  overflowX: 'auto',
                }}
              >
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <table
                style={{
                  width: '100%',
                  marginTop: '1em',
                  marginBottom: '1em',
                  fontSize: '13.5px',
                  borderCollapse: 'collapse',
                }}
              >
                {children}
              </table>
            ),
            thead: ({ children }) => (
              <thead className="text-foreground/50" style={{ fontSize: '12.5px' }}>
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th
                style={{
                  textAlign: 'left',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderBottom: '0.5px solid currentColor',
                  opacity: 0.2,
                }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                style={{
                  padding: '6px 12px',
                  borderBottom: '0.5px solid currentColor',
                  opacity: 0.9,
                }}
              >
                {children}
              </td>
            ),
          }}
        >
          {cleaned}
        </ReactMarkdown>
      </article>
    </div>
  );
}
