import type { Event, Group, User } from '../types';
import { eventStartMs } from '../store/outingsSlice';
import { computeMatchScore } from './matching';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function selectWeekPicks(
  events: Event[],
  currentUser: User,
  groups: Group[],
  nowMs = Date.now(),
): Event[] {
  const joinedEventIds = new Set(
    groups
      .filter((group) => group.status !== 'cancelled' && group.members.includes(currentUser.id))
      .map((group) => group.eventId),
  );
  return events
    .filter((event) => {
      const start = eventStartMs(event);
      return start !== null && start >= nowMs && start <= nowMs + WEEK_MS && !joinedEventIds.has(event.id);
    })
    .sort((a, b) => computeMatchScore(currentUser, b) - computeMatchScore(currentUser, a))
    .slice(0, 3);
}
