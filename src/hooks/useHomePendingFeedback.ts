import { useMemo } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';

export function useHomePendingFeedback(): Event | undefined {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  return useMemo(() => {
    if (!currentUser) return undefined;
    const userGroupEventIds = groups
      .filter((g) => g.members.includes(currentUser.id))
      .map((g) => g.eventId);
    return events.find((e) => {
      if (!userGroupEventIds.includes(e.id)) return false;
      if (feedbackSubmitted[e.id]) return false;
      try {
        return new Date(`${e.date}T${e.time || '20:00'}`) < new Date();
      } catch {
        return new Date(e.date) < new Date();
      }
    });
  }, [events, groups, currentUser, feedbackSubmitted]);
}
