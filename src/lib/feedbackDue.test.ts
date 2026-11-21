import { describe, expect, it } from 'vitest';
import type { Event, Group } from '../types';
import {
  FEEDBACK_AFTER_END_MS,
  FEEDBACK_JOIN_SKIP_LIMIT,
  feedbackDueAt,
  isFeedbackDue,
  pendingFeedbackEvents,
  shouldBlockJoinForFeedback,
  starsForMood,
} from './feedbackDue';

const event = (partial: Partial<Event> & Pick<Event, 'id' | 'date' | 'time'>): Event =>
  ({
    title: partial.id,
    category: 'Social',
    description: '',
    duration: '2h',
    locationArea: 'Athens',
    isPaid: false,
    price: 0,
    organizerId: 'u2',
    safetyLevel: 'low',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 8,
    ...partial,
  }) as Event;

const group = (eventId: string): Group =>
  ({
    id: `g-${eventId}`,
    eventId,
    members: ['u1'],
    pendingMembers: [],
    targetSize: 4,
    status: 'confirmed',
    discountUnlocked: false,
  }) as Group;

describe('feedbackDueAt', () => {
  it('asks 45 minutes after the inferred end, not at the door', () => {
    const e = event({ id: 'e1', date: '2026-11-20', time: '20:00', duration: '2h' });
    const due = feedbackDueAt(e)!;
    // 20:00 + 2h + 45m = 22:45
    expect(due.getTime()).toBe(new Date('2026-11-20T22:45:00').getTime());
    expect(isFeedbackDue(e, new Date('2026-11-20T22:44:00'))).toBe(false);
    expect(isFeedbackDue(e, new Date('2026-11-20T22:45:00'))).toBe(true);
    expect(FEEDBACK_AFTER_END_MS).toBe(45 * 60 * 1000);
  });
});

describe('pendingFeedbackEvents / join skip', () => {
  const nights = [
    event({ id: 'a', date: '2026-11-01', time: '20:00' }),
    event({ id: 'b', date: '2026-11-08', time: '20:00' }),
    event({ id: 'c', date: '2026-11-15', time: '20:00' }),
  ];
  const groups = nights.map((e) => group(e.id));
  const now = new Date('2026-11-20T12:00:00');

  it('lists due unreviewed membership nights oldest first', () => {
    const list = pendingFeedbackEvents({
      events: nights,
      groups,
      userId: 'u1',
      feedbackSubmitted: { b: { eventId: 'b' } },
      now,
    });
    expect(list.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('does not block join for one or two skipped nights', () => {
    expect(shouldBlockJoinForFeedback(0)).toBe(false);
    expect(shouldBlockJoinForFeedback(2)).toBe(false);
    expect(shouldBlockJoinForFeedback(FEEDBACK_JOIN_SKIP_LIMIT)).toBe(true);
  });

  it('does not count cancelled nights toward the join skip quota', () => {
    const cancelled = event({ id: 'x', date: '2026-11-01', time: '20:00', status: 'cancelled' });
    const list = pendingFeedbackEvents({
      events: [nights[0], nights[1], cancelled],
      groups: [groups[0], groups[1], { ...group('x'), status: 'cancelled' }],
      userId: 'u1',
      feedbackSubmitted: {},
      now,
    });
    expect(list.map((e) => e.id)).toEqual(['a', 'b']);
    expect(shouldBlockJoinForFeedback(list.length)).toBe(false);
  });

  it('skips members marked absent at the door', () => {
    const e = event({ id: 'door', date: '2026-11-01', time: '20:00' });
    const g: Group = {
      ...group('door'),
      checkInClosedAt: '2026-11-01T23:00:00.000Z',
      checkIns: { u2: { at: '2026-11-01T20:05:00.000Z', by: 'u2', method: 'manual' } },
    };
    const list = pendingFeedbackEvents({
      events: [e],
      groups: [g],
      userId: 'u1',
      feedbackSubmitted: {},
      now,
    });
    expect(list).toEqual([]);
  });
});

describe('starsForMood', () => {
  it('maps the four moods to a private 2–5 score', () => {
    expect(starsForMood('amazing')).toBe(5);
    expect(starsForMood('meh')).toBe(2);
    expect(starsForMood('')).toBe(0);
  });
});
