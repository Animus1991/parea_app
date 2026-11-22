import { describe, expect, it } from 'vitest';
import { challengeProgress } from './challengeProgress';
import type { Event, Group } from '../types';
import type { FeedbackData } from '../store';

const event = (id: string, date: string, category = 'Cinema') => ({ id, date, category } as Event);
const feedback = (eventId: string, comment = '') => ({ eventId, comment, submittedAt: '2026-01-27T12:00:00' } as FeedbackData);
const now = new Date('2026-01-30T12:00:00');

describe('truthful challenge progress', () => {
  it('uses attended event dates, distinct weeks, categories and actual comments', () => {
    const result = challengeProgress({
      userId: 'u1', now,
      events: [event('a', '2025-12-29'), event('b', '2026-01-05'), event('c', '2026-01-12', 'Hiking'), event('d', '2026-01-13'), event('e', '2026-02-01')],
      groups: [{ id: 'g', eventId: 'b', status: 'completed', checkIns: { u1: { at: '2026-01-05T18:00:00' } } } as Group],
      feedback: { a: feedback('a', 'Great'), b: feedback('b'), c: feedback('c', 'Nice'), d: feedback('d'), e: feedback('e') },
    });
    expect(result).toEqual({ monthlyEvents: 3, monthDaysLeft: 1, weeklyStreak: 3, categories: 2, commentedReviews: 2 });
  });

  it('has no progress for empty or signed-out data', () => {
    expect(challengeProgress({ now, events: [], groups: [], feedback: {} })).toEqual({ monthlyEvents: 0, monthDaysLeft: 1, weeklyStreak: 0, categories: 0, commentedReviews: 0 });
    expect(challengeProgress({ now, events: [event('a', '2026-01-01')], groups: [], feedback: { a: feedback('a', 'Great') } }).monthlyEvents).toBe(0);
  });

  it('excludes invalid dates, no-shows, future check-ins and memberships without attendance', () => {
    const result = challengeProgress({ userId: 'u1', now,
      events: [event('a', 'bad-date'), event('b', '2026-01-01'), event('c', '2026-01-02')],
      groups: [{ eventId: 'c', members: ['u1'], checkIns: { u1: { at: '2026-02-01' } } } as unknown as Group],
      feedback: { a: feedback('a'), b: { ...feedback('b'), attendance: 'no_show' } },
    });
    expect(result.monthlyEvents).toBe(0);
    expect(result.weeklyStreak).toBe(0);
    expect(result.categories).toBe(0);
  });
});
