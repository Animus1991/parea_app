/**
 * Bulk calendar export — builds multi-VEVENT ICS using the same escape /
 * download helpers as single-event `eventCalendarExport` (Wave C merge).
 */
import { parseISO } from 'date-fns';
import { downloadIcsBlob, escapeIcsText, formatGoogleCalendarDate } from './eventCalendarExport';

export interface CalendarIcsEvent {
  title: string;
  date: string;
  time?: string;
  locationArea?: string;
}

/** Build a multi-event .ics string (local floating DTSTART, optional LOCATION). */
export function buildCalendarIcs(events: CalendarIcsEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nakamas//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const ev of events) {
    const dt = parseISO(`${ev.date}T${ev.time || '00:00'}`);
    if (Number.isNaN(dt.getTime())) continue;
    const dtStr = formatGoogleCalendarDate(dt);
    const uid = `bulk-${ev.date}-${ev.time || '00'}-${escapeIcsText(ev.title).slice(0, 40)}@parea.app`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatGoogleCalendarDate(new Date())}`);
    lines.push(`DTSTART:${dtStr}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.locationArea) lines.push(`LOCATION:${escapeIcsText(ev.locationArea)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarIcs(
  events: CalendarIcsEvent[],
  filename = 'parea-calendar.ics',
): void {
  downloadIcsBlob(buildCalendarIcs(events), filename);
}
