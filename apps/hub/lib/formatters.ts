/** Format date as "9. apr." */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(d);
}

/** Format date as "I dag", "I morgen", or short date */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === now.toDateString()) return 'I dag';
  if (d.toDateString() === tomorrow.toDateString()) return 'I morgen';
  return formatShortDate(d);
}

/** Format time range "14:00 – 15:00" */
export function formatTimeRange(start: string, end: string, isAllDay: boolean): string {
  if (isAllDay) return 'Hele dagen';
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Format relative time "3 min siden" */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Akkurat nå';
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffHours < 24) return `${diffHours} t siden`;
  return `${diffDays} d siden`;
}

/** Get greeting based on time of day */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'God morgen';
  if (hour < 17) return 'God ettermiddag';
  return 'God kveld';
}

/** Format Norwegian date "onsdag 9. april" */
export function formatNorwegianDate(date: Date): string {
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
