import { describe, expect, it } from 'vitest';
import type { Event, Group } from '../types';
import { selectUpcomingCalendarEvents } from './useUserCalendarEvents';

const event = (over: Partial<Event> = {}): Event =>
  ({
    id: 'e-public',
    title: 'Sunday concert',
    category: 'Music',
    description: '',
    date: '2026-11-29',
    time: '20:00',
    duration: '2h',
    locationArea: 'Athens',
    isPaid: false,
    price: 0,
    organizerId: 'org',
    safetyLevel: 'low',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 20,
    ...over,
  }) as Event;

const group = (over: Partial<Group> = {}): Group =>
  ({
    id: 'g1',
    eventId: 'mo1',
    members: ['u1'],
    pendingMembers: [],
    targetSize: 4,
    status: 'confirmed',
    discountUnlocked: false,
    ...over,
  }) as Group;

const now = new Date('2026-11-21T08:00:00');
const hike = event({ id: 'mo1', title: 'Saturday hike', date: '2026-11-22', time: '09:00' });
const concert = event({ id: 'e-public', title: 'Sunday concert', date: '2026-11-29' });

describe('selectUpcomingCalendarEvents', () => {
  it('shows the public catalog when logged out', () => {
    const ids = selectUpcomingCalendarEvents([hike, concert], [group()], null, now).map((e) => e.id);
    expect(ids).toEqual(['mo1', 'e-public']);
  });

  it('keeps a signed-in member with only a cancelled group off unrelated nights', () => {
    const ids = selectUpcomingCalendarEvents(
      [hike, concert],
      [group({ status: 'cancelled' })],
      'u1',
      now,
    ).map((e) => e.id);
    expect(ids).toEqual([]);
  });

  it('still lists live memberships after another night is cancelled', () => {
    const live = event({ id: 'nn1', title: 'Nakamas Nights', date: '2026-11-27' });
    const ids = selectUpcomingCalendarEvents(
      [hike, concert, live],
      [group({ status: 'cancelled' }), group({ id: 'g-nn1', eventId: 'nn1' })],
      'u1',
      now,
    ).map((e) => e.id);
    expect(ids).toEqual(['nn1']);
  });
});
