import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { usePlannedEvents } from './usePlannedEvents';
import { usePlansFormingFeed } from './usePlansFormingFeed';
import { buildReturnSummary, type ReturnVisitPart } from '../lib/returnVisit';
import { previousVisitAt, touchVisit } from '../lib/visitClock';
import { useWallAccess, useWallStore } from '../store/wallStore';
import { visiblePosts } from '../lib/audience';

const TOUCH_EVERY_MS = 5 * 60 * 1000;

/** The welcome-back parts for the signed-in user (see lib/returnVisit). */
export function useReturnSummary(): ReturnVisitPart[] {
  const userId = useStore((s) => s.currentUser?.id ?? null);
  const notifications = useStore((s) => s.notifications);
  const conversations = useChatStore((s) => s.conversations);
  const { plannedEvents } = usePlannedEvents();
  const feed = usePlansFormingFeed(30);
  const posts = useWallStore((s) => s.posts);
  const wallAccess = useWallAccess();
  const [previous] = useState(() => (userId ? previousVisitAt(userId) : null));

  useEffect(() => {
    if (!userId) return;
    const touch = () => touchVisit(userId);
    const onHide = () => {
      if (document.visibilityState === 'hidden') touch();
    };
    const timer = window.setInterval(touch, TOUCH_EVERY_MS);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [userId]);

  return useMemo(() => {
    if (!userId) return [];
    const next = plannedEvents[0];
    const newPlans =
      previous === null ? 0 : feed.items.filter((item) => Date.parse(item.intent.createdAt) > previous).length;
    return buildReturnSummary({
      now: new Date(),
      previousVisitAt: previous,
      nextEvent: next ? { id: next.id, title: next.title, start: next.startDateTime } : null,
      newPlans,
      unreadChats: conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),
      unreadNotifications: notifications.filter((n) => !n.read).length,
      newPosts:
        previous === null
          ? 0
          : visiblePosts(userId, posts, wallAccess).filter((p) => p.authorId !== userId && Date.parse(p.createdAt) > previous).length,
    });
  }, [userId, previous, plannedEvents, feed.items, conversations, notifications, posts, wallAccess]);
}
