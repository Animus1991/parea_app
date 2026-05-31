import { parseISO } from 'date-fns';

export interface CalendarIcsEvent {
  title: string;
  date: string;
  time?: string;
  locationArea?: string;
}

/** Build a multi-event .ics string (UTC DTSTART, ZIP-compatible bulk export). */
export function buildCalendarIcs(events: CalendarIcsEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parea//Calendar//EN',
  ];
  for (const ev of events) {
    const dt = parseISO(`${ev.date}T${ev.time || '00:00'}`);
    const dtStr = Number.isNaN(dt.getTime())
      ? ''
      : `${dt.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    if (!dtStr) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`DTSTART:${dtStr}`);
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.locationArea) lines.push(`LOCATION:${ev.locationArea}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarIcs(
  events: CalendarIcsEvent[],
  filename = 'parea-calendar.ics',
): void {
  const icsContent = buildCalendarIcs(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
