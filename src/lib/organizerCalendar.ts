/**
 * Organizer calendars you can follow (Φ27, after Luma): one .ics feed per
 * organizer, with «παρέα σχηματίζεται» in each event. Pure (no DOM), so the
 * same builder serves the in-app download and the server feed.
 */
import type { Event, Group } from '../types';
import { escapeIcsText, formatGoogleCalendarDate, getEventDateRange } from './eventCalendarExport';
import { formingGroups } from './outings';

export function buildOrganizerIcs(
  organizer: { id: string; name: string },
  events: Event[],
  groups: Group[],
  origin = 'https://parea.app',
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nakamas//Organizer Calendar//EL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(/nakamas/i.test(organizer.name) ? organizer.name : `${organizer.name} · Nakamas`)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ];
  // RFC 5545: DTSTAMP is always UTC.
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const mine = events
    .filter((e) => e.organizerId === organizer.id && e.status !== 'cancelled' && e.status !== 'archived')
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const e of mine) {
    const range = getEventDateRange(e);
    if (!range) continue;
    const forming = formingGroups(e, groups).length;
    const url = `${origin}/events/${e.id}`;
    const note =
      forming > 0
        ? `Παρέα σχηματίζεται: ${forming} ${forming === 1 ? 'ομάδα' : 'ομάδες'} με θέσεις. Μπες: ${url}`
        : `Βρες παρέα για αυτή την εκδήλωση: ${url}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${organizer.id}@parea.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatGoogleCalendarDate(range.start)}`,
      `DTEND:${formatGoogleCalendarDate(range.end)}`,
      `SUMMARY:${escapeIcsText(e.title)}`,
      `DESCRIPTION:${escapeIcsText(note)}`,
      `LOCATION:${escapeIcsText(e.locationArea)}`,
      `URL:${url}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Subscription URL for calendar apps (webcal opens «subscribe» instead of a one-off import). */
export function organizerCalendarUrl(origin: string, organizerId: string): { https: string; webcal: string } {
  const https = `${origin}/api/calendar/organizer/${encodeURIComponent(organizerId)}.ics`;
  return { https, webcal: https.replace(/^https?:/, 'webcal:') };
}
