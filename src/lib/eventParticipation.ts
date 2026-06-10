import { parseISO, startOfDay, isBefore } from 'date-fns';
import type { Event, Group, User } from '../types';
import { inferEventEndDate } from './eventCalendarExport';

/** Event start is before now (date + time). */
export function isEventPast(event: Event, now = new Date()): boolean {
  try {
    const [h, m] = (event.time || '23:59').split(':').map((x) => parseInt(x, 10));
    const d = parseISO(event.date);
    d.setHours(Number.isNaN(h) ? 23 : h, Number.isNaN(m) ? 59 : m, 0, 0);
    return d.getTime() < now.getTime();
  } catch {
    return isBefore(parseISO(event.date), startOfDay(now));
  }
}

/** Current time is after inferred event end (for host organization feedback). */
export function isEventCompleted(event: Event, now = new Date()): boolean {
  const end = inferEventEndDate(event);
  if (!end) return isEventPast(event, now);
  return end.getTime() < now.getTime();
}

export function isUserEventParticipant(
  eventId: string,
  user: User | null | undefined,
  groups: Group[],
): boolean {
  if (!user) return false;
  return groups.some(
    (g) =>
      g.eventId === eventId &&
      (g.members.includes(user.id) || g.pendingMembers?.includes(user.id)),
  );
}
