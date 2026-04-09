import { fetchRecentEmails } from '@/lib/gmail/fetch-emails';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatEmailDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export default async function InboxPage() {
  const emails = await fetchRecentEmails(30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Innboks</h2>
        {emails.length > 0 && (
          <span className="text-sm text-muted-foreground">{emails.length} e-poster</span>
        )}
      </div>

      {emails.length > 0 ? (
        <div className="rounded-md border divide-y">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                email.isUnread ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${email.isUnread ? 'font-semibold' : 'font-medium'}`}>
                      {email.fromName}
                    </span>
                    {email.isUnread && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        Ulest
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${email.isUnread ? 'font-medium' : ''}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {email.snippet}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatEmailDate(email.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Ingen e-poster funnet. Logg inn med Google for å se innboksen din.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Du må kanskje logge ut og inn igjen for å gi tilgang til Gmail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
