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
    // Fix broken sentences: newlines before punctuation (". \n\n" or ",\n\n")
    .replace(/\n+\.\s*/g, '. ')
    .replace(/\n+,\s*/g, ', ')
    // Fix broken sentences: newlines in the middle of a sentence (lowercase/comma before \n\n + lowercase after)
    .replace(/([a-zæøå,])\s*\n\n\s*([a-zæøå])/gi, (_, before, after) => {
      // If before is comma or lowercase, and after is lowercase — join them
      if (after === after.toLowerCase()) {
        return `${before} ${after}`;
      }
      return `${before}\n\n${after}`;
    })
    .replace(/\n\n\.\s*\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const cleaned = cleanContent(content);

  return (
    <div className="mx-auto" style={{ maxWidth: '700px' }}>
      <article
        className="text-foreground"
        style={{ fontSize: '14.5px', lineHeight: 1.8 }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1
                className="first:mt-0"
                style={{
                  fontSize: '1.625rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  marginTop: '1.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2
                className="first:mt-0"
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  marginTop: '1.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  marginTop: '1rem',
                  marginBottom: '0.5rem',
                }}
              >
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p style={{ marginTop: 0, marginBottom: '1.25rem' }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
                paddingLeft: '1.5rem',
                listStyleType: 'disc',
              }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol style={{
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
                paddingLeft: '1.5rem',
                listStyleType: 'decimal',
              }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: '0.3125rem', lineHeight: 1.75 }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 600 }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ fontStyle: 'italic' }}>{children}</em>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1a56db',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: '3px solid #d1d5db',
                  paddingLeft: '1rem',
                  margin: '1rem 0',
                  color: '#6b7280',
                  fontStyle: 'normal',
                }}
              >
                {children}
              </blockquote>
            ),
            hr: () => (
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid rgba(0, 0, 0, 0.15)',
                  margin: '1.5rem 0',
                }}
              />
            ),
            code: ({ children }) => (
              <code
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '0.875em',
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  color: 'inherit',
                }}
              >
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '6px',
                  padding: '1rem 1.25rem',
                  marginTop: '0.75rem',
                  marginBottom: '1rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '1rem 0',
                  fontSize: '0.9375rem',
                }}
              >
                {children}
              </table>
            ),
            thead: ({ children }) => (
              <thead style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.15)' }}>
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th
                style={{
                  fontWeight: 600,
                  textAlign: 'left' as const,
                  padding: '0.5rem 0.75rem',
                }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                style={{
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
                }}
              >
                {children}
              </td>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt ?? ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  margin: '0.5rem 0',
                }}
              />
            ),
          }}
        >
          {cleaned}
        </ReactMarkdown>
      </article>
    </div>
  );
}
