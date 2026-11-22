import { differenceInCalendarDays, differenceInCalendarWeeks, endOfMonth, isValid, parseISO, startOfWeek } from 'date-fns';
import type { Event, Group } from '../types';
import type { FeedbackData } from '../store';

export function challengeProgress({
  userId, events, groups, feedback, now = new Date(),
}: {
  userId?: string;
  events: Event[];
  groups: Group[];
  feedback: Record<string, FeedbackData>;
  now?: Date;
}) {
  const attendedIds = new Set<string>();
  if (userId) {
    for (const group of groups) {
      const checkIn = group.checkIns?.[userId];
      if (group.status !== 'cancelled' && checkIn && parseISO(checkIn.at) <= now) attendedIds.add(group.eventId);
    }
    for (const answer of Object.values(feedback)) {
      if (answer.attendance !== 'no_show' && answer.attendance !== 'late_cancel' && parseISO(answer.submittedAt) <= now) {
        attendedIds.add(answer.eventId);
      }
    }
  }
  const attended = events.filter((e) => attendedIds.has(e.id) && e.status !== 'cancelled' && isValid(parseISO(e.date)) && parseISO(e.date) <= now);
  const dates = attended.map((e) => parseISO(e.date));
  const weeks = [...new Set(dates.map((d) => startOfWeek(d, { weekStartsOn: 1 }).getTime()))].sort((a, b) => a - b);
  let streak = 0;
  let longestStreak = 0;
  weeks.forEach((week, i) => {
    streak = i > 0 && differenceInCalendarWeeks(week, weeks[i - 1], { weekStartsOn: 1 }) === 1 ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
  });
  return {
    monthlyEvents: dates.filter((d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()).length,
    monthDaysLeft: differenceInCalendarDays(endOfMonth(now), now),
    weeklyStreak: longestStreak,
    categories: new Set(attended.map((e) => e.category)).size,
    commentedReviews: userId ? Object.values(feedback).filter((f) => f.comment.trim() && parseISO(f.submittedAt) <= now).length : 0,
  };
}
