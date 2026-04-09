import { getGmailClient } from './client';

export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

export async function fetchRecentEmails(maxResults = 20): Promise<EmailSummary[]> {
  const gmail = await getGmailClient();

  if (!gmail) {
    return [];
  }

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });

    const messages = response.data.messages ?? [];

    const emails: EmailSummary[] = [];

    for (const msg of messages.slice(0, maxResults)) {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers ?? [];
        const fromHeader = headers.find(h => h.name === 'From')?.value ?? '';
        const subject = headers.find(h => h.name === 'Subject')?.value ?? '(ingen emne)';
        const dateHeader = headers.find(h => h.name === 'Date')?.value ?? '';

        // Parse "Name <email>" format
        const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
        const fromName = fromMatch?.[1]?.replace(/"/g, '') ?? fromHeader;
        const fromEmail = fromMatch?.[2] ?? fromHeader;

        const isUnread = detail.data.labelIds?.includes('UNREAD') ?? false;

        emails.push({
          id: detail.data.id ?? '',
          threadId: detail.data.threadId ?? '',
          from: fromEmail,
          fromName,
          subject,
          snippet: detail.data.snippet ?? '',
          date: dateHeader,
          isUnread,
        });
      } catch {
        // Skip individual email errors
        continue;
      }
    }

    return emails;
  } catch (err) {
    console.error('[Gmail] Feil ved henting av e-post:', err instanceof Error ? err.message : err);
    return [];
  }
}
