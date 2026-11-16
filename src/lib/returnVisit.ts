import { differenceInCalendarDays, format } from 'date-fns';

/**
 * "Welcome back" line for the Home hero: the next plan within two days and
 * what is new since the previous visit. Pure, so it is easy to test.
 */
export interface ReturnVisitInput {
  now: Date;
  /** Previous visit (ms since epoch), or null on a first visit. */
  previousVisitAt: number | null;
  nextEvent: { id: string; title: string; start: Date; groupId?: string } | null;
  /** Plans for you created after the previous visit. */
  newPlans: number;
  unreadChats: number;
  unreadNotifications: number;
  /** Φ26 — wall posts by others, visible to the user, since the previous visit. */
  newPosts?: number;
  /** Φ27 — confirmed group ready since last visit (or unread ready moment). */
  readyGroup?: { groupId: string; title: string } | null;
}

export type ReturnVisitPart =
  | { kind: 'next'; eventId: string; title: string; day: 'today' | 'tomorrow' | 'dayAfter'; time: string; groupId?: string }
  | { kind: 'ready'; groupId: string; title: string }
  | { kind: 'plans'; count: number }
  | { kind: 'posts'; count: number }
  | { kind: 'chats'; count: number }
  | { kind: 'notifications'; count: number };

/** A visit counts as a return after this much time away. */
export const RETURN_GAP_MS = 30 * 60 * 1000;

export function buildReturnSummary(input: ReturnVisitInput): ReturnVisitPart[] {
  const parts: ReturnVisitPart[] = [];
  const { now, nextEvent } = input;
  if (nextEvent && nextEvent.start.getTime() >= now.getTime()) {
    const days = differenceInCalendarDays(nextEvent.start, now);
    if (days <= 2) {
      parts.push({
        kind: 'next',
        eventId: nextEvent.id,
        title: nextEvent.title,
        day: days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'dayAfter',
        time: format(nextEvent.start, 'HH:mm'),
        groupId: nextEvent.groupId,
      });
    }
  }
  const returning = input.previousVisitAt !== null && now.getTime() - input.previousVisitAt >= RETURN_GAP_MS;
  if (returning) {
    // Prefer the Φ27 ready moment over generic plan/noise when present.
    if (input.readyGroup) {
      parts.push({ kind: 'ready', groupId: input.readyGroup.groupId, title: input.readyGroup.title });
    }
    if (input.newPlans > 0) parts.push({ kind: 'plans', count: input.newPlans });
    if ((input.newPosts ?? 0) > 0) parts.push({ kind: 'posts', count: input.newPosts ?? 0 });
    if (input.unreadChats > 0) parts.push({ kind: 'chats', count: input.unreadChats });
    if (input.unreadNotifications > 0) parts.push({ kind: 'notifications', count: input.unreadNotifications });
  }
  // One quiet line: the next plan plus at most two kinds of news.
  return parts.slice(0, 3);
}

type T = (el: string, en: string) => string;

export function describeReturnPart(part: ReturnVisitPart, t: T): string {
  switch (part.kind) {
    case 'next': {
      const day =
        part.day === 'today' ? t('σήμερα', 'today') : part.day === 'tomorrow' ? t('αύριο', 'tomorrow') : t('μεθαύριο', 'in two days');
      return t(`Επόμενο: ${day} ${part.time}, ${part.title}`, `Next: ${day} ${part.time}, ${part.title}`);
    }
    case 'ready':
      return t(`Η παρέα σου είναι έτοιμη · ${part.title}`, `Your group is ready · ${part.title}`);
    case 'plans':
      return part.count === 1 ? t('1 νέο σχέδιο για σένα', '1 new plan for you') : t(`${part.count} νέα σχέδια για σένα`, `${part.count} new plans for you`);
    case 'posts':
      return part.count === 1
        ? t('1 νέα δημοσίευση από Nakamas', '1 new post from your Nakamas')
        : t(`${part.count} νέες δημοσιεύσεις στον τοίχο`, `${part.count} new wall posts`);
    case 'chats':
      return part.count === 1 ? t('1 νέο μήνυμα', '1 new message') : t(`${part.count} νέα μηνύματα`, `${part.count} new messages`);
    case 'notifications':
      return part.count === 1 ? t('1 ειδοποίηση', '1 notification') : t(`${part.count} ειδοποιήσεις`, `${part.count} notifications`);
  }
}

export function returnPartPath(part: ReturnVisitPart): string {
  switch (part.kind) {
    case 'next':
      return part.groupId ? `/night/${part.groupId}` : `/events/${part.eventId}`;
    case 'ready':
      return `/night/${part.groupId}`;
    case 'plans':
      return '/buddy-seek';
    case 'posts':
      return '/wall';
    case 'chats':
      return '/chats';
    case 'notifications':
      return '/notifications';
  }
}
