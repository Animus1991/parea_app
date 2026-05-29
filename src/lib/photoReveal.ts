import { differenceInHours, parseISO } from 'date-fns';
import type { Group } from '../types';

/** Photo-last: reveal avatars only close to event time for confirmed group members. */
export function shouldRevealMemberPhoto(
  eventDate: string,
  eventTime: string,
  group: Group | null | undefined,
  userId: string,
  isSelf: boolean,
): boolean {
  if (isSelf) return true;
  if (!group || !group.members.includes(userId)) return false;
  if (group.status !== 'confirmed' && group.status !== 'completed') {
    const hoursUntil = hoursUntilEvent(eventDate, eventTime);
    return hoursUntil <= 48 && hoursUntil >= 0;
  }
  const hoursUntil = hoursUntilEvent(eventDate, eventTime);
  return hoursUntil <= 24;
}

export function getPhotoPlaceholder(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function hoursUntilEvent(date: string, time: string): number {
  try {
    const [h, m] = (time || '19:00').split(':').map(Number);
    const d = parseISO(date);
    d.setHours(h || 19, m || 0, 0, 0);
    return differenceInHours(d, new Date());
  } catch {
    return 999;
  }
}
