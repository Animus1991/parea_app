import { describe, expect, it } from 'vitest';
import { filterHomeEvents, sortHomeEvents } from './homeEventFeed';
import type { Event } from '../types';

const base = (over: Partial<Event> = {}): Event => ({
  id: 'e1',
  title: 'Night',
  category: 'Cinema',
  description: 'x',
  date: '2026-12-01',
  time: '20:00',
  duration: '2h',
  locationArea: 'Athens',
  isPaid: false,
  price: 0,
  organizerId: 'org1',
  safetyLevel: 'low',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 8,
  tags: [],
  ...over,
});

const filters = {
  currentUser: null,
  feedType: 'Discover' as const,
  searchQuery: '',
  activeCategory: 'All',
  tagFilter: 'All',
  priceFilter: 'All' as const,
  dateFilter: 'Any' as const,
  safetyFilter: 'All' as const,
  radiusFilter: 'Any' as const,
  seekingHostOnly: false,
  isSeekingHost: () => false,
  getDistance: () => 1,
};

describe('filterHomeEvents', () => {
  it('keeps finished nights in Discover so the catalog still scrolls', () => {
    const past = base({ id: 'e4', date: '2026-05-14', time: '20:45' });
    const next = base({ id: 'e30', date: '2026-12-01' });
    const result = filterHomeEvents({ events: [past, next], ...filters });
    expect(result.map((e) => e.id).sort()).toEqual(['e30', 'e4']);
  });

  it('hides nights that cannot fit a Thursday evening window', () => {
    const thursdayNight = base({ id: 'fit', date: '2026-11-19', time: '21:00' });
    const fridayMorning = base({ id: 'noise', date: '2026-11-20', time: '10:00' });
    const result = filterHomeEvents({
      events: [thursdayNight, fridayMorning],
      ...filters,
      schedule: {
        dates: [],
        weekdays: [4],
        windowIds: ['night'],
        hourFrom: null,
        hourTo: null,
      },
    });
    expect(result.map((e) => e.id)).toEqual(['fit']);
  });
});

describe('sortHomeEvents', () => {
  it('sorts upcoming nights before finished ones', () => {
    const past = base({ id: 'e4', date: '2026-11-14', time: '20:45' });
    const next = base({ id: 'e30', date: '2026-12-01', time: '21:00' });
    const now = new Date('2026-11-18T14:00:00');
    const result = sortHomeEvents([past, next], 'Relevance', null, () => 1, now);
    expect(result.map((e) => e.id)).toEqual(['e30', 'e4']);
  });
});
