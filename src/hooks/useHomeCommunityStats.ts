import { useMemo } from 'react';
import { parseISO, isThisMonth } from 'date-fns';
import { useStore } from '../store';

export function useHomeCommunityStats() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  return useMemo(() => {
    const userGroupIds = currentUser
      ? groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId)
      : [];
    const eventsThisMonth = events.filter((e) => {
      if (!userGroupIds.includes(e.id)) return false;
      try {
        return isThisMonth(parseISO(e.date));
      } catch {
        return false;
      }
    }).length;

    const totalEventsAttended = Object.keys(feedbackSubmitted).length;
    const currentStreak = Math.min(totalEventsAttended, 7);
    const xpTotal = totalEventsAttended * 50 + (currentUser?.reliabilityScore ?? 80);
    const communityLevel = Math.floor(xpTotal / 200) + 1;

    return { eventsThisMonth, currentStreak, xpTotal, communityLevel };
  }, [events, groups, currentUser, feedbackSubmitted]);
}
