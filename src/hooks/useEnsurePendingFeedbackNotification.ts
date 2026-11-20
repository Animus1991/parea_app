import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { useLanguageStore } from '../store/languageStore';
import { buildPendingFeedbackNotification, pendingFeedbackNotificationId } from '../lib/notificationsUtil';
import { pendingFeedbackEvents, soonestUpcomingFeedbackDueAt } from '../lib/feedbackDue';
import { tryBrowserPushFeedback } from '../lib/feedbackBrowserPush';

const WAKE_AT_MOST_MS = 6 * 60 * 60 * 1000;

/**
 * After a night ends (+45 min), seed one unread bell row per due event.
 * Browser push only if permission is already granted. Home stays quiet.
 * Join stays open until several of these sit unanswered.
 */
export function useEnsurePendingFeedbackNotification() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const userId = useStore((s) => s.currentUser?.id);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const notifications = useStore((s) => s.notifications);
  const addNotification = useStore((s) => s.addNotification);
  const remindersOn = useStore((s) => s.userSettings.notificationPrefs.reminders !== false);
  const language = useLanguageStore((s) => s.language);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const seeded = useRef(new Set<string>());
  const pushed = useRef(new Set<string>());

  const pending = useMemo(() => {
    if (!userId) return [];
    return pendingFeedbackEvents({
      events,
      groups,
      userId,
      feedbackSubmitted,
      now: new Date(nowMs),
    });
  }, [events, groups, userId, feedbackSubmitted, nowMs]);

  const nextDue = useMemo(() => {
    if (!userId) return null;
    return soonestUpcomingFeedbackDueAt({
      events,
      groups,
      userId,
      feedbackSubmitted,
      now: new Date(nowMs),
    });
  }, [events, groups, userId, feedbackSubmitted, nowMs]);

  useEffect(() => {
    if (!userId) return;
    for (const event of pending) {
      const id = pendingFeedbackNotificationId(event.id);
      const already =
        notifications.some((n) => n.id === id || (n.type === 'feedback' && n.eventId === event.id));
      if (already) {
        seeded.current.add(id);
        pushed.current.add(id);
        continue;
      }
      if (!seeded.current.has(id)) {
        seeded.current.add(id);
        addNotification({
          ...buildPendingFeedbackNotification(userId, event),
        } as Record<string, unknown>);
      }
      if (remindersOn && !pushed.current.has(id)) {
        pushed.current.add(id);
        tryBrowserPushFeedback(event, language);
      }
    }
  }, [pending, userId, notifications, addNotification, remindersOn, language]);

  useEffect(() => {
    if (!nextDue) return;
    const delay = Math.min(Math.max(nextDue.getTime() - Date.now(), 250), WAKE_AT_MOST_MS);
    const timer = window.setTimeout(() => setNowMs(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [nextDue, nowMs]);
}
