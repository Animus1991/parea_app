import type { Event, Group } from '../types';
import { inferEventEndDate } from './eventCalendarExport';
import { isLiveCatalogEvent } from './eventDisplay';

/** Wait this long after the night ends before asking how it went. */
export const FEEDBACK_AFTER_END_MS = 45 * 60 * 1000;

/** Join other nights until this many due reviews sit unanswered. */
export const FEEDBACK_JOIN_SKIP_LIMIT = 3;

export function feedbackDueAt(event: Event): Date | null {
  const end = inferEventEndDate(event);
  if (!end) return null;
  return new Date(end.getTime() + FEEDBACK_AFTER_END_MS);
}

export function isFeedbackDue(event: Event, now = new Date()): boolean {
  const at = feedbackDueAt(event);
  if (!at) return false;
  return now.getTime() >= at.getTime();
}

export function shouldBlockJoinForFeedback(pendingCount: number): boolean {
  return pendingCount >= FEEDBACK_JOIN_SKIP_LIMIT;
}

/** Door closed without this member — absences stay on check-in, not the vibe form. */
export function memberWasAbsentAtDoor(
  groups: Group[],
  eventId: string,
  userId: string,
): boolean {
  const group = groups.find((g) => g.eventId === eventId && g.members.includes(userId));
  if (!group?.checkInClosedAt) return false;
  return !group.checkIns?.[userId];
}

export function pendingFeedbackEvents(opts: {
  events: Event[];
  groups: Group[];
  userId: string;
  feedbackSubmitted: Record<string, unknown>;
  now?: Date;
}): Event[] {
  const now = opts.now ?? new Date();
  const mine = new Set(
    opts.groups
      .filter((g) => g.status !== 'cancelled' && g.members.includes(opts.userId))
      .map((g) => g.eventId),
  );
  return opts.events
    .filter((e) => {
      if (!isLiveCatalogEvent(e)) return false;
      if (!mine.has(e.id)) return false;
      if (opts.feedbackSubmitted[e.id]) return false;
      if (memberWasAbsentAtDoor(opts.groups, e.id, opts.userId)) return false;
      return isFeedbackDue(e, now);
    })
    .sort((a, b) => {
      const aa = feedbackDueAt(a)?.getTime() ?? 0;
      const bb = feedbackDueAt(b)?.getTime() ?? 0;
      return aa - bb;
    });
}

/** Soonest moment a membership night becomes due (for scheduling the notice). */
export function soonestUpcomingFeedbackDueAt(opts: {
  events: Event[];
  groups: Group[];
  userId: string;
  feedbackSubmitted: Record<string, unknown>;
  now?: Date;
}): Date | null {
  const now = opts.now ?? new Date();
  const mine = new Set(
    opts.groups
      .filter((g) => g.status !== 'cancelled' && g.members.includes(opts.userId))
      .map((g) => g.eventId),
  );
  let soonest: Date | null = null;
  for (const e of opts.events) {
    if (!isLiveCatalogEvent(e) || !mine.has(e.id) || opts.feedbackSubmitted[e.id]) continue;
    if (memberWasAbsentAtDoor(opts.groups, e.id, opts.userId)) continue;
    const at = feedbackDueAt(e);
    if (!at || at.getTime() <= now.getTime()) continue;
    if (!soonest || at.getTime() < soonest.getTime()) soonest = at;
  }
  return soonest;
}

export const FEEDBACK_MOODS = [
  { id: 'amazing', emoji: '🤩', el: 'Φανταστικά', en: 'Amazing', stars: 5 },
  { id: 'good', emoji: '😊', el: 'Ωραία', en: 'Good', stars: 4 },
  { id: 'okay', emoji: '😐', el: 'Μέτρια', en: 'Okay', stars: 3 },
  { id: 'meh', emoji: '😕', el: 'Όχι ιδιαίτερα', en: 'Not really', stars: 2 },
] as const;

export type FeedbackMoodId = (typeof FEEDBACK_MOODS)[number]['id'];

export function starsForMood(mood: string): number {
  return FEEDBACK_MOODS.find((m) => m.id === mood)?.stars ?? 0;
}
