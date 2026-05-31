import type { Event } from '../types';

function toLocalIcs(dt: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 60;
  let parsedMins = 0;
  const hMatch = duration.match(/(\d+)h/);
  const mMatch = duration.match(/(\d+)m/);
  if (hMatch) parsedMins += parseInt(hMatch[1], 10) * 60;
  if (mMatch) parsedMins += parseInt(mMatch[1], 10);
  return parsedMins > 0 ? parsedMins : 60;
}

/** Build and download a single-event .ics file (floating local time, no UTC offset bug). */
export function downloadEventIcs(event: Event): void {
  let startDate = '';
  let endDate = '';

  try {
    const start = new Date(`${event.date}T${event.time}`);
    startDate = toLocalIcs(start);
    const end = new Date(start.getTime() + parseDurationMinutes(event.duration) * 60_000);
    endDate = toLocalIcs(end);
  } catch (e) {
    console.error('Invalid event date for ICS', e);
    return;
  }

  const title = event.title || 'Parea Event';
  const description = (event.description || '').replace(/\n/g, '\\n');
  const location = event.locationArea || '';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parea App//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
