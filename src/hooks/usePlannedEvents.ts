import { useMemo } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { useStore } from '../store';
import { eventToPlannedEvent } from '../lib/plannedEvents';
import type { PlannedEvent } from '../types/plannedEvent';

const MAX_PLANNED = 60;

/**
 * Confirmed / pending planned events for the logged-in user (group membership).
 */
export function usePlannedEvents() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const waitlistedEvents = useStore((s) => s.waitlistedEvents) ?? [];

  const now = startOfDay(new Date());

  const plannedEvents = useMemo(() => {
    if (!currentUser) return [] as PlannedEvent[];

    const list: PlannedEvent[] = [];

    for (const event of events) {
      const d = parseISO(event.date);
      if (Number.isNaN(d.getTime()) || d < now) continue;

      const userGroups = groups.filter(
        (g) =>
          g.eventId === event.id &&
          (g.members.includes(currentUser.id) || g.pendingMembers?.includes(currentUser.id)),
      );

      if (userGroups.length === 0) continue;

      const primary = userGroups.find((g) => g.members.includes(currentUser.id)) ?? userGroups[0];
      const planned = eventToPlannedEvent(
        event,
        primary,
        currentUser,
        waitlistedEvents.includes(event.id),
      );
      if (planned) list.push(planned);
    }

    return list
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
      .slice(0, MAX_PLANNED);
  }, [events, groups, currentUser, waitlistedEvents, now]);

  return { plannedEvents, currentUser, groups };
}
