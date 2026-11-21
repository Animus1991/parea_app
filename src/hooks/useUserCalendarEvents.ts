import { useMemo } from 'react';
import { parseISO, startOfDay, isSameDay } from 'date-fns';
import { useStore } from '../store';
import { isLiveCatalogEvent } from '../lib/eventDisplay';
import type { Event, Group } from '../types';

export type CalendarEventWithDate = Event & { parsedDate: Date };

const MAX_UPCOMING = 50;

function isUserOnGroup(group: Group, userId: string): boolean {
  return group.members.includes(userId) || Boolean(group.pendingMembers?.includes(userId));
}

/**
 * Personal upcoming nights for My Calendar.
 * Logged-out (or never joined) sees the public catalog. A signed-in member
 * whose only groups were cancelled gets an empty schedule, not every event.
 */
export function selectUpcomingCalendarEvents(
  events: Event[],
  groups: Group[],
  userId: string | null,
  now: Date,
): CalendarEventWithDate[] {
  const hasMembership = Boolean(userId && groups.some((g) => isUserOnGroup(g, userId)));
  const liveMembershipIds = new Set(
    userId
      ? groups
          .filter((g) => g.status !== 'cancelled' && isUserOnGroup(g, userId))
          .map((g) => g.eventId)
      : [],
  );

  return events
    .filter((e) => {
      if (!isLiveCatalogEvent(e)) return false;
      const d = parseISO(e.date);
      if (Number.isNaN(d.getTime())) return false;
      if (d < now) return false;
      if (!userId || !hasMembership) return true;
      return liveMembershipIds.has(e.id);
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, MAX_UPCOMING)
    .map((e) => ({ ...e, parsedDate: parseISO(e.date) })) as CalendarEventWithDate[];
}

/**
 * User-scoped upcoming events for My Calendar (group membership or all when logged out).
 * Shared between calendar grid, ICS export, and day/hourly views.
 */
export function useUserCalendarEvents() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);

  const now = startOfDay(new Date());

  const upcomingEvents = useMemo(
    () => selectUpcomingCalendarEvents(events, groups, currentUser?.id ?? null, now),
    [events, groups, currentUser?.id, now],
  );

  const eventsForDay = (day: Date) =>
    upcomingEvents.filter((e) => isSameDay(e.parsedDate, day));

  return { upcomingEvents, eventsForDay, currentUser };
}
