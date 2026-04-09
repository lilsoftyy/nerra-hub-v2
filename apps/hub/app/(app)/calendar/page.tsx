import { fetchUpcomingEvents } from '@/lib/calendar/fetch-events';
import { Badge } from '@/components/ui/badge';
import { CreateEventForm } from '@/components/calendar/create-event-form';
import { DeleteEventButton } from '@/components/calendar/delete-event-button';

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
        <h1 className="text-xl font-semibold tracking-tight">Kalender</h1>
        <CreateEventForm />
      </div>

      {events.length > 0 ? (
        <div className="max-w-2xl space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium capitalize">{dateLabel}</h3>
                {dayEvents[0] && isToday(dayEvents[0].start) && (
                  <Badge variant="secondary" className="text-[10px]">I dag</Badge>
                )}
                {dayEvents[0] && isTomorrow(dayEvents[0].start) && (
                  <Badge variant="secondary" className="text-[10px]">I morgen</Badge>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-[background-color] duration-150 hover:bg-muted/50"
                  >
                    <div className="w-[90px] shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatTimeRange(event.start, event.end, event.isAllDay)}
                    </div>
                    <div className="h-4 w-px bg-primary/30" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{event.title}</p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.meetLink && (
                        <a
                          href={event.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Meet
                        </a>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-[opacity] duration-150">
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl py-12 text-center">
          <p className="text-sm text-muted-foreground">Ingen kommende hendelser.</p>
        </div>
      )}
    </div>
  );
}
