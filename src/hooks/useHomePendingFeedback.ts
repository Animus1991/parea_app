import { useMemo } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';

/** Same pending night that `canJoinEvent` uses to block the next join. */
export function useHomePendingFeedback(): Event | undefined {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  return useMemo(() => {
    const id = useStore.getState().getPendingFeedbackEventId();
    if (!id) return undefined;
    return events.find((e) => e.id === id);
  }, [events, groups, currentUser, feedbackSubmitted]);
}
