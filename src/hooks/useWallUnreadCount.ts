import { useEffect, useState } from 'react';
import { useStore } from '../store';

/**
 * Unread wall activity for the signed-in person (badges on «Τοίχος Nakamas»
 * and the bell). The wall store is loaded on demand, so the app shell does not
 * carry wall code in its first bundle. Respects the «Δραστηριότητα τοίχου»
 * notification preference and hides activity from blocked people.
 */
export function useWallUnreadCount(): number {
  const userId = useStore((s) => s.currentUser?.id ?? null);
  const enabled = useStore((s) => s.userSettings.notificationPrefs.social !== false);
  const blocked = useStore((s) => s.blockedUserIds);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId || !enabled) {
      setCount(0);
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void import('../store/wallStore').then(({ useWallStore }) => {
      if (cancelled) return;
      const compute = (activity: { recipientId: string; actorId: string; read: boolean }[]) =>
        activity.filter((a) => a.recipientId === userId && !a.read && !blocked.includes(a.actorId)).length;
      setCount(compute(useWallStore.getState().activity));
      unsubscribe = useWallStore.subscribe((s) => setCount(compute(s.activity)));
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userId, enabled, blocked]);

  return count;
}
