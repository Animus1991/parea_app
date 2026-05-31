import { useMemo } from 'react';
import { parseISO, startOfDay, isSameDay } from 'date-fns';
import { useStore } from '../store';
import type { Event } from '../types';

export type CalendarEventWithDate = Event & { parsedDate: Date };

const MAX_UPCOMING = 50;

/**
 * User-scoped upcoming events for My Calendar (group membership or all when logged out).
 * Shared between calendar grid, ICS export, and day/hourly views.
 */
export function useUserCalendarEvents() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);

  const now = startOfDay(new Date());

  const userEventIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      groups
        .filter(
          (g) =>
            g.members.includes(currentUser.id) ||
            g.pendingMembers?.includes(currentUser.id),
        )
        .map((g) => g.eventId),
    );
  }, [currentUser, groups]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = parseISO(e.date);
        if (Number.isNaN(d.getTime())) return false;
        if (d < now) return false;
        return userEventIds.size > 0 ? userEventIds.has(e.id) : true;
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, MAX_UPCOMING)
      .map((e) => ({ ...e, parsedDate: parseISO(e.date) })) as CalendarEventWithDate[];
  }, [events, now, userEventIds]);

  const eventsForDay = (day: Date) =>
    upcomingEvents.filter((e) => isSameDay(e.parsedDate, day));

  return { upcomingEvents, eventsForDay, currentUser };
}
