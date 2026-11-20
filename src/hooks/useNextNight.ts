import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useStore } from '../store';
import { useEventsResource } from './useEventsQuery';

/** The member's next booked night within a week (the main reason to come back). */
export function useNextNight() {
  const { events } = useEventsResource();
  const groups = useStore((s) => s.groups);
  const meId = useStore((s) => s.currentUser?.id);
  if (!meId) return null;
  const now = Date.now();
  const mine = groups.filter((g) => g.members.includes(meId) && g.status !== 'cancelled');
  const next = events
    .filter((e) => {
      const ms = new Date(e.date).getTime();
      return !Number.isNaN(ms) && ms >= now && mine.some((g) => g.eventId === e.id);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!next) return null;
  const days = differenceInCalendarDays(parseISO(next.date), new Date());
  if (days > 7) return null;
  const group = mine.find((g) => g.eventId === next.id);
  return { event: next, group, days, path: group ? `/night/${group.id}` : `/events/${next.id}` };
}
