import { describe, expect, it } from 'vitest';
import type { Event, Group, User } from '../types';
import { selectWeekPicks } from './weekPicks';

const makeEvent = (id: string, day: number, tags: string[]): Event => ({
  id,
  title: id,
  category: 'Music',
  description: '',
  date: `2030-01-${String(day).padStart(2, '0')}`,
  time: '20:00',
  duration: '2h',
  locationArea: 'Athens',
  isPaid: false,
  price: 0,
  organizerId: 'organizer',
  safetyLevel: 'low',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 10,
  tags,
});

const user: User = {
  id: 'me',
  name: 'Me',
  ageRange: '25-34',
  city: 'Athens',
  interests: ['music'],
  trustTier: '1_explorer',
  reliabilityScore: 80,
  badges: [],
  emailVerified: false,
  phoneVerified: false,
  paymentVerified: false,
  idVerified: false,
  isOrganizer: false,
};

describe('selectWeekPicks', () => {
  it('returns the three highest matching events in the next seven days, excluding joined events', () => {
    const now = new Date(2030, 0, 1, 0, 0).getTime();
    const events = [
      makeEvent('joined', 2, ['music']),
      makeEvent('match', 3, ['music']),
      makeEvent('less-match', 4, ['theatre']),
      makeEvent('third', 5, ['music']),
      makeEvent('fourth', 6, ['music']),
      makeEvent('outside', 9, ['music']),
    ];
    const joinedGroup = {
      id: 'g1',
      eventId: 'joined',
      members: ['me'],
      pendingMembers: [],
      targetSize: 4,
      status: 'confirmed',
      discountUnlocked: false,
    } satisfies Group;
    const cancelledGroup = {
      ...joinedGroup,
      id: 'g2',
      eventId: 'match',
      status: 'cancelled',
    } satisfies Group;

    expect(selectWeekPicks(events, user, [joinedGroup, cancelledGroup], now).map((event) => event.id)).toEqual([
      'match',
      'third',
      'fourth',
    ]);
  });
});
