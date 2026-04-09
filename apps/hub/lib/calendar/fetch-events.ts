import { getCalendarClient } from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  attendees: string[];
  meetLink: string | null;
  isAllDay: boolean;
}

export async function fetchUpcomingEvents(maxResults = 20): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClient();

  if (!calendar) {
    return [];
  }

  try {
    const now = new Date().toISOString();
    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now,
      timeMax: twoWeeksFromNow,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items ?? [];

    return events.map((event) => {
      const isAllDay = !!event.start?.date && !event.start?.dateTime;

      return {
        id: event.id ?? '',
        title: event.summary ?? '(uten tittel)',
        start: event.start?.dateTime ?? event.start?.date ?? '',
        end: event.end?.dateTime ?? event.end?.date ?? '',
        location: event.location ?? null,
        description: event.description ?? null,
        attendees: (event.attendees ?? [])
          .map((a) => a.displayName ?? a.email ?? '')
          .filter(Boolean),
        meetLink: event.hangoutLink ?? null,
        isAllDay,
      };
    });
  } catch {
    return [];
  }
}
