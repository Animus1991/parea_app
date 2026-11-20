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

/**
 * Persisted mock events keep their May–June authored dates and would all look
 * finished. Overlay the live seed schedule onto catalog ids; user-created
 * extras (unknown ids) keep whatever dates they were saved with.
 */
export function withLiveSeedSchedule<T extends { id: string; date: string; time?: string }>(
  seedEvents: T[],
  mergedEvents: T[],
): T[] {
  const seeds = new Map(seedEvents.map((event) => [event.id, event]));
  return mergedEvents.map((event) => {
    const seed = seeds.get(event.id);
    if (!seed) return event;
    if (event.date === seed.date && event.time === seed.time) return event;
    return { ...event, date: seed.date, time: seed.time };
  });
}

export type AuthoredSchedule = { date: string; time?: string };

/**
 * Recompute catalog dates from the authored May–June season.
 * Persisted events often still carry those authored dates (or a stale shift);
 * comparing them to already-shifted seed dates is not enough.
 */
export function refreshLiveCatalogDates<T extends { id: string; date: string; time?: string }>(
  events: T[],
  authoredById: ReadonlyMap<string, AuthoredSchedule>,
  now: Date = new Date(),
): T[] {
  return events.map((event) => {
    const authored = authoredById.get(event.id);
    if (!authored) return event;
    const date = liveCatalogDate(authored.date, event.id, now);
    const time = authored.time ?? event.time;
    if (event.date === date && event.time === time) return event;
    return { ...event, date, time };
  });
}

/** Authored mock season — persisted localStorage often still holds these dates. */
const AUTHORED_SEASON_START = '2026-05-01';
const AUTHORED_SEASON_END = '2026-07-01';

/**
 * Shift leftover May–June catalog dates to "today". Does not touch already-live
 * November+ dates (avoids a second shift) or user-created extras outside the season.
 */
export function coerceAuthoredSeasonToLive<T extends { id: string; date: string }>(
  events: T[],
  now: Date = new Date(),
): T[] {
  return events.map((event) => {
    const authored = event.date;
    if (authored < AUTHORED_SEASON_START || authored >= AUTHORED_SEASON_END) return event;
    const date = liveCatalogDate(authored, event.id, now);
    if (date === authored) return event;
    return { ...event, date };
  });
}
