import { describe, expect, it } from 'vitest';
import { filterHomeEvents } from './homeEventFeed';
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
  it('hides finished nights from the joinable Discover feed', () => {
    const past = base({ id: 'e4', date: '2026-05-14', time: '20:45' });
    const next = base({ id: 'e30', date: '2026-12-01' });
    const now = new Date('2026-11-18T14:00:00');
    const result = filterHomeEvents({ events: [past, next], ...filters, now });
    expect(result.map((e) => e.id)).toEqual(['e30']);
  });
});
