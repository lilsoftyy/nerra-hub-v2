'use server';

import { getCalendarClient } from '@/lib/calendar/client';
import { revalidatePath } from 'next/cache';

export async function createCalendarEvent(formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const attendeesRaw = formData.get('attendees') as string;
  const description = formData.get('description') as string;

  if (!title || !date || !startTime || !endTime) {
    return { error: 'Tittel, dato, start- og sluttidspunkt er påkrevd' };
  }

  const calendar = await getCalendarClient();
  if (!calendar) {
    return { error: 'Ingen tilgang til Google Calendar. Logg ut og inn igjen.' };
  }

  const attendees = attendeesRaw
    ? attendeesRaw.split(',').map((e) => ({ email: e.trim() })).filter((a) => a.email)
    : [];

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: description || undefined,
        start: {
          dateTime: `${date}T${startTime}:00`,
          timeZone: 'Europe/Oslo',
        },
        end: {
          dateTime: `${date}T${endTime}:00`,
          timeZone: 'Europe/Oslo',
        },
        attendees,
      },
    });

    revalidatePath('/calendar');
    return { success: true, eventId: event.data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukjent feil';
    return { error: `Kunne ikke opprette hendelse: ${message}` };
  }
}
