import type { AppNotification } from '../data/mockNotifications';

export type NotificationDigestWindow = 'off' | 'morning' | 'afternoon';

const MORNING_TYPES = new Set(['match', 'reminder', 'achievement', 'group']);

export function isMorningDigestItem(notif: AppNotification): boolean {
  return MORNING_TYPES.has(notif.type);
}

export function digestItems(
  notifs: AppNotification[],
  window: Exclude<NotificationDigestWindow, 'off'>,
): AppNotification[] {
  return notifs.filter((n) =>
    window === 'morning' ? isMorningDigestItem(n) : !isMorningDigestItem(n),
  );
}
