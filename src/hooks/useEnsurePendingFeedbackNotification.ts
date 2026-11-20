import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { buildPendingFeedbackNotification, pendingFeedbackNotificationId } from '../lib/notificationsUtil';
import { useHomePendingFeedback } from './useHomePendingFeedback';

/**
 * When a past night still needs a rating, put one unread row in Notifications
 * (bell badge included). Home stays quiet; join is still blocked until they rate.
 */
export function useEnsurePendingFeedbackNotification() {
  const pending = useHomePendingFeedback();
  const userId = useStore((s) => s.currentUser?.id);
  const notifications = useStore((s) => s.notifications);
  const addNotification = useStore((s) => s.addNotification);
  const seeded = useRef(new Set<string>());

  useEffect(() => {
    if (!pending || !userId) return;
    const id = pendingFeedbackNotificationId(pending.id);
    if (seeded.current.has(id)) return;
    if (notifications.some((n) => n.id === id || (n.type === 'feedback' && n.eventId === pending.id))) {
      seeded.current.add(id);
      return;
    }
    seeded.current.add(id);
    addNotification({
      ...buildPendingFeedbackNotification(userId, pending),
    } as Record<string, unknown>);
  }, [pending, userId, notifications, addNotification]);
}
