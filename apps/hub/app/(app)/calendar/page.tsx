import { fetchUpcomingEvents } from '@/lib/calendar/fetch-events';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateEventForm } from '@/components/calendar/create-event-form';

function formatTimeRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Hele dagen';
  try {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '';
  }
}

function isToday(dateStr: string): boolean {
  try {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

function isTomorrow(dateStr: string): boolean {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(dateStr).toDateString() === tomorrow.toDateString();
  } catch {
    return false;
  }
}

export default async function CalendarPage() {
  const events = await fetchUpcomingEvents(30);

  // Group events by date
  const grouped: Record<string, typeof events> = {};
  for (const event of events) {
    const dateKey = new Date(event.start).toLocaleDateString('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kalender</h2>
        <div className="flex items-center gap-4">
          {events.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Neste {events.length} hendelser
            </span>
          )}
          <CreateEventForm />
        </div>
      </div>

      {events.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold capitalize">{dateLabel}</h3>
                {dayEvents[0] && isToday(dayEvents[0].start) && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">I dag</Badge>
                )}
                {dayEvents[0] && isTomorrow(dayEvents[0].start) && (
                  <Badge variant="secondary">I morgen</Badge>
                )}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeRange(event.start, event.end, event.isAllDay)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground mt-0.5">{event.location}</p>
                          )}
                          {event.attendees.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {event.attendees.join(', ')}
                            </p>
                          )}
                        </div>
                        {event.meetLink && (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Bli med i møte
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Ingen kommende hendelser funnet.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Logg ut og inn igjen for å gi tilgang til Google Calendar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
