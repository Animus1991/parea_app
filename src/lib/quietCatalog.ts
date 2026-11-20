import type { Event, Group, User } from '../types';
import { isEventPast } from './eventDisplay';
import { getEventGroupProgress } from './groupUtils';
import {
  eventMatchesSchedule,
  isScheduleFilterActive,
  scheduleFromCoarseAvailability,
} from './homeScheduleFilter';

export function bookedEventIds(userId: string | undefined, groups: Group[]): Set<string> {
  if (!userId) return new Set();
  return new Set(
    groups
      .filter((g) => g.status !== 'cancelled' && g.members.includes(userId))
      .map((g) => g.eventId),
  );
}

export function userJoinedEvent(
  event: Event,
  userId: string | undefined,
  groups: Group[],
): boolean {
  return Boolean(userId) && bookedEventIds(userId, groups).has(event.id);
}

export function eventIsFull(event: Event, groups: Group[]): boolean {
  return getEventGroupProgress(event, groups).spotsLeft <= 0;
}

/** Same calendar day as a night the user already booked — not the booked night itself. */
export function eventConflictsWithPlans(
  event: Event,
  userId: string | undefined,
  groups: Group[],
  catalog: Event[],
): boolean {
  if (!userId) return false;
  const booked = bookedEventIds(userId, groups);
  if (booked.has(event.id)) return false;
  const dates = new Set(catalog.filter((e) => booked.has(e.id)).map((e) => e.date));
  return dates.has(event.date);
}

export function usualHoursSlots(
  user: User | null | undefined,
  coarseAvailability?: string[],
): string[] {
  const fromPrefs = user?.discoveryPrefs?.schedule ?? [];
  if (fromPrefs.length > 0) return fromPrefs;
  return coarseAvailability ?? [];
}

export function matchesUsualHours(
  event: Event,
  user: User | null | undefined,
  coarseAvailability?: string[],
): boolean {
  const slots = usualHoursSlots(user, coarseAvailability);
  if (slots.length === 0 || slots.includes('flexible')) return false;
  const schedule = scheduleFromCoarseAvailability(slots);
  if (!isScheduleFilterActive(schedule)) return false;
  return eventMatchesSchedule(event, schedule);
}

export function hasUsualHours(
  user: User | null | undefined,
  coarseAvailability?: string[],
): boolean {
  const slots = usualHoursSlots(user, coarseAvailability);
  if (slots.length === 0 || slots.includes('flexible')) return false;
  return isScheduleFilterActive(scheduleFromCoarseAvailability(slots));
}

export interface QuietCatalogBuckets {
  primary: Event[];
  conflicts: Event[];
  /** Events the signed-in user already has a spot in. */
  joined: Event[];
  /** Events with no spots left that the user has not joined. */
  full: Event[];
  past: Event[];
}

export function partitionQuietCatalog(
  events: Event[],
  opts: {
    userId?: string;
    groups: Group[];
    catalog: Event[];
    hidePast: boolean;
    now?: Date;
  },
): QuietCatalogBuckets {
  const buckets: QuietCatalogBuckets = {
    primary: [],
    conflicts: [],
    joined: [],
    full: [],
    past: [],
  };
  const now = opts.now ?? new Date();
  for (const event of events) {
    if (opts.hidePast && isEventPast(event, now)) {
      buckets.past.push(event);
      continue;
    }
    if (userJoinedEvent(event, opts.userId, opts.groups)) {
      buckets.joined.push(event);
      continue;
    }
    if (eventIsFull(event, opts.groups)) {
      buckets.full.push(event);
      continue;
    }
    if (eventConflictsWithPlans(event, opts.userId, opts.groups, opts.catalog)) {
      buckets.conflicts.push(event);
      continue;
    }
    buckets.primary.push(event);
  }
  return buckets;
}

export function storiesWithoutFeedDupes(stories: Event[], feedEventIds: Set<string>): Event[] {
  const unique = stories.filter((event) => !feedEventIds.has(event.id));
  return unique.length > 0 ? unique : stories.slice(0, Math.min(3, stories.length));
}
