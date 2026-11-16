import type { AppNotification } from '../data/mockNotifications';

/** Rows without `forUserId` belong to the active inbox; targeted rows only to that user. */
export function notificationsForUser(
  notifications: AppNotification[],
  userId: string | null | undefined,
): AppNotification[] {
  if (!userId) return notifications.filter((n) => !n.forUserId);
  return notifications.filter((n) => !n.forUserId || n.forUserId === userId);
}

/** Normalize legacy or partial notification payloads to AppNotification (Φ16.2). */
export function normalizeAppNotification(input: Record<string, unknown>): AppNotification {
  const n = { ...input };
  if (n.message && !n.messageEn) {
    n.messageEn = n.message;
    n.messageGr = n.messageGr ?? n.message;
  }
  if (n.time && !n.timeEn) {
    n.timeEn = n.time;
    n.timeGr = n.timeGr ?? n.time;
  }
  return {
    id: (n.id as string) ?? Date.now().toString(),
    type: (n.type as string) ?? 'system',
    messageEn: (n.messageEn as string) ?? '',
    messageGr: (n.messageGr as string) ?? '',
    timeEn: (n.timeEn as string) ?? 'Just now',
    timeGr: (n.timeGr as string) ?? 'Μόλις τώρα',
    read: false,
    icon: n.icon as AppNotification['icon'],
    color: n.color as string | undefined,
    groupId: typeof n.groupId === 'string' ? n.groupId : undefined,
    eventId: typeof n.eventId === 'string' ? n.eventId : undefined,
    forUserId: typeof n.forUserId === 'string' ? n.forUserId : undefined,
  };
}
