import type { Event } from '../types';

export interface EventDateRange {
  start: Date;
  end: Date;
}

export interface EventCalendarAvailability {
  ok: boolean;
  reasonEl: string;
  reasonEn: string;
}

function parseDurationMinutes(duration?: string): number | null {
  if (!duration) return null;
  let parsedMins = 0;
  const hMatch = duration.match(/(\d+)h/i);
  const mMatch = duration.match(/(\d+)m/i);
  if (hMatch) parsedMins += parseInt(hMatch[1], 10) * 60;
  if (mMatch) parsedMins += parseInt(mMatch[1], 10);
  return parsedMins > 0 ? parsedMins : null;
}

function categoryBlob(event: Event): string {
  return `${event.category} ${event.title} ${(event.tags ?? []).join(' ')}`.toLowerCase();
}

/** Infer duration in minutes when `event.duration` is missing. */
export function inferEventDurationMinutes(event: Event): number {
  const fromField = parseDurationMinutes(event.duration);
  if (fromField) return fromField;

  const blob = categoryBlob(event);

  if (
    /hik|hike|escape|day trip|daytrip|πεζοπο|εκδρομ|trek|trail|island|ferry/.test(blob)
  ) {
    return 6 * 60;
  }
  if (/concert|festival|συναυλ|φεστιβ/.test(blob)) {
    return 3 * 60;
  }
  if (
    /theatre|theater|cinema|stand-up|standup|κωμωδ|θεατρ|σινεμ|παράσταση|comedy show/.test(
      blob,
    )
  ) {
    return 2 * 60;
  }
  if (/workshop|εργαστ|class|μάθημα|cooking/.test(blob)) {
    return 2 * 60;
  }
  return 2 * 60;
}

export function parseEventStart(event: Event): Date | null {
  if (!event.date) return null;
  const time = event.time?.trim() || '12:00';
  const d = new Date(`${event.date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function inferEventEndDate(event: Event, start?: Date): Date | null {
  const s = start ?? parseEventStart(event);
  if (!s) return null;
  return new Date(s.getTime() + inferEventDurationMinutes(event) * 60_000);
}

export function getEventDateRange(event: Event): EventDateRange | null {
  const start = parseEventStart(event);
  if (!start) return null;
  const end = inferEventEndDate(event, start);
  if (!end) return null;
  return { start, end };
}

export function getEventCalendarAvailability(event: Event): EventCalendarAvailability {
  const range = getEventDateRange(event);
  if (!range) {
    return {
      ok: false,
      reasonEl: 'Η ημερομηνία της εκδήλωσης δεν είναι διαθέσιμη για εξαγωγή.',
      reasonEn: 'Event date is not available for calendar export.',
    };
  }
  return { ok: true, reasonEl: '', reasonEn: '' };
}

/** Google Calendar `dates` param segment (local floating time). */
export function formatGoogleCalendarDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildCalendarDescription(event: Event, eventUrl: string, hostName?: string): string {
  const lines: string[] = [];
  if (event.description) lines.push(event.description);
  if (hostName) lines.push(`Host: ${hostName}`);
  lines.push(eventUrl);
  return lines.join('\n\n');
}

function buildCalendarLocation(event: Event, meetingPoint?: string): string {
  const parts = [
    event.exactLocation,
    event.locationArea,
    meetingPoint,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function buildGoogleCalendarUrl(
  event: Event,
  options?: { eventUrl?: string; hostName?: string; meetingPoint?: string },
): string | null {
  const range = getEventDateRange(event);
  if (!range) return null;

  const eventUrl =
    options?.eventUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/events/${event.id}`
      : `/events/${event.id}`);

  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    buildCalendarDescription(event, eventUrl, options?.hostName),
  );
  const location = encodeURIComponent(
    buildCalendarLocation(event, options?.meetingPoint),
  );
  const dates = `${formatGoogleCalendarDate(range.start)}/${formatGoogleCalendarDate(range.end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${dates}`;
}

export function buildICSContent(
  event: Event,
  options?: { eventUrl?: string; hostName?: string; meetingPoint?: string },
): string | null {
  const range = getEventDateRange(event);
  if (!range) return null;

  const eventUrl =
    options?.eventUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/events/${event.id}`
      : `/events/${event.id}`);

  const uid = `${event.id}@parea.app`;
  const dtStamp = formatGoogleCalendarDate(new Date());
  const dtStart = formatGoogleCalendarDate(range.start);
  const dtEnd = formatGoogleCalendarDate(range.end);
  const summary = escapeIcsText(event.title);
  const description = escapeIcsText(
    buildCalendarDescription(event, eventUrl, options?.hostName),
  );
  const location = escapeIcsText(buildCalendarLocation(event, options?.meetingPoint));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parea App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${eventUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(
  event: Event,
  options?: { eventUrl?: string; hostName?: string; meetingPoint?: string },
): boolean {
  const content = buildICSContent(event, options);
  if (!content) return false;

  const title = event.title || 'parea-event';
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
}

export function openGoogleCalendar(event: Event, options?: Parameters<typeof buildGoogleCalendarUrl>[1]): boolean {
  const url = buildGoogleCalendarUrl(event, options);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
