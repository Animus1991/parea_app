import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

/**
 * Authored mock catalog is a May–June 2026 season. Shift it so "today" still
 * has upcoming nights, while a few attended events stay in the past for
 * pending-review demos.
 */
export const DEMO_CATALOG_ORIGIN = '2026-05-13';
export const DEMO_PAST_EVENT_IDS = new Set(['e4']);

export function liveCatalogDate(
  authoredIso: string,
  eventId: string,
  now: Date = new Date(),
): string {
  if (DEMO_PAST_EVENT_IDS.has(eventId)) {
    return format(addDays(startOfDay(now), -4), 'yyyy-MM-dd');
  }
  const shift = differenceInCalendarDays(startOfDay(now), parseISO(DEMO_CATALOG_ORIGIN));
  return format(addDays(parseISO(authoredIso), shift), 'yyyy-MM-dd');
}

export function applyLiveCatalogDates<T extends { id: string; date: string }>(
  events: T[],
  now: Date = new Date(),
): T[] {
  return events.map((event) => ({
    ...event,
    date: liveCatalogDate(event.date, event.id, now),
  }));
}
