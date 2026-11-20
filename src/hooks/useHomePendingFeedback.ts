import { useMemo } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { pendingFeedbackEvents } from '../lib/feedbackDue';

/** Nights whose small form is due — oldest first. Join is not blocked until three sit unanswered. */
export function usePendingFeedbackEvents(): Event[] {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  return useMemo(() => {
    if (!currentUser) return [];
    return pendingFeedbackEvents({
      events,
      groups,
      userId: currentUser.id,
      feedbackSubmitted,
    });
  }, [events, groups, currentUser, feedbackSubmitted]);
}

export function useHomePendingFeedback(): Event | undefined {
  return usePendingFeedbackEvents()[0];
}
