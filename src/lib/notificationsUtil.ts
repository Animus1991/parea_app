import type { AppNotification } from '../data/mockNotifications';

export function pendingFeedbackNotificationId(eventId: string): string {
  return `feedback-pending-${eventId}`;
}

/** Quiet reminder after the night — join stays open until several are skipped. */
export function buildPendingFeedbackNotification(
  userId: string,
  event: { id: string; title: string },
): AppNotification {
  return {
    id: pendingFeedbackNotificationId(event.id),
    type: 'feedback',
    messageGr: `Πώς πέρασες στο «${event.title}»;`,
    messageEn: `How was “${event.title}”?`,
    timeGr: 'Τώρα',
    timeEn: 'Now',
    read: false,
    eventId: event.id,
    forUserId: userId,
  };
}

/** Rows without `forUserId` belong to the active inbox; targeted rows only to that user. */
export function notificationsForUser(
  notifications: AppNotification[],
  userId: string | null | undefined,
): AppNotification[] {
  if (!userId) return notifications.filter((n) => !n.forUserId);
  return notifications.filter((n) => !n.forUserId || n.forUserId === userId);
}

/**
 * Unify React Query API seed with Zustand live rows (Φ27 ready / waitlist /
 * hand-over). Store wins on the same id (read state, deep-link fields).
 */
export function mergeNotificationLists(
  api: AppNotification[],
  store: AppNotification[],
): AppNotification[] {
  const storeIds = new Set(store.map((n) => n.id));
  const byId = new Map<string, AppNotification>();
  for (const n of api) byId.set(n.id, n);
  for (const n of store) byId.set(n.id, n);
  const out: AppNotification[] = [];
  for (const n of store) {
    const row = byId.get(n.id);
    if (row) out.push(row);
  }
  for (const n of api) {
    if (storeIds.has(n.id)) continue;
    const row = byId.get(n.id);
    if (row) out.push(row);
  }
  return out;
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
