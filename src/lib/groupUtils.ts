import type { Event, Group } from '../types';

export interface GroupProgress {
  current: number;
  target: number;
  percent: number;
  spotsLeft: number;
  discountUnlocked: boolean;
  membersNeededForDiscount: number;
}

export function getEventGroupProgress(
  event: Event,
  groups: Group[],
): GroupProgress {
  const eventGroups = groups.filter((g) => g.eventId === event.id);
  const primary =
    eventGroups.sort((a, b) => b.members.length - a.members.length)[0] ??
    null;

  const current = primary?.members.length ?? 0;
  const target = primary?.targetSize ?? event.maxParticipants ?? 5;
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const spotsLeft = Math.max(0, target - current);

  const minDiscount = event.groupDiscount?.minSize ?? 4;
  const discountUnlocked =
    Boolean(primary?.discountUnlocked) ||
    (Boolean(event.groupDiscount) && current >= minDiscount);

  return {
    current,
    target,
    percent,
    spotsLeft,
    discountUnlocked,
    membersNeededForDiscount: Math.max(0, minDiscount - current),
  };
}

export function shouldUnlockGroupDiscount(
  group: Group,
  event: Event,
): boolean {
  if (!event.groupDiscount) return false;
  return group.members.length >= event.groupDiscount.minSize;
}

export function computeDiscountedPrice(event: Event, memberCount: number): number {
  if (!event.isPaid || !event.groupDiscount) return event.price;
  if (memberCount < event.groupDiscount.minSize) return event.price;
  const discount = event.price * (event.groupDiscount.percentage / 100);
  return Math.round((event.price - discount) * 100) / 100;
}
