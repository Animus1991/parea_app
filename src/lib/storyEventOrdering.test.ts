import { describe, expect, it } from 'vitest';
import { sortEventsForStories } from './storyEventOrdering';
import { withFreshCatalogDates } from './catalogAuthoredSchedule';
import { isEventPast } from './eventDisplay';
import type { Event, Group } from '../types';

const event = (over: Partial<Event> = {}): Event => ({
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

describe('sortEventsForStories', () => {
  it('keeps every upcoming night — Discover is not a 3-item sample', () => {
    const events = Array.from({ length: 12 }, (_, i) =>
      event({ id: `e${i + 1}`, date: `2026-12-${String(i + 1).padStart(2, '0')}` }),
    );
    const groups: Group[] = [];
    expect(sortEventsForStories(events, groups)).toHaveLength(12);
  });

  it('restores the full catalog into stories after stale May dates in persist', () => {
    const now = new Date('2026-11-19T12:00:00');
    const stale = [
      event({ id: 'e1', date: '2026-05-15', time: '19:00' }),
      event({ id: 'e2', date: '2026-05-16', time: '17:00' }),
      event({ id: 'e3', date: '2026-05-17', time: '21:00' }),
      event({ id: 'nn1', date: '2026-11-27', time: '20:30' }),
    ];
    const live = withFreshCatalogDates(stale, now);
    const storyEvents = sortEventsForStories(live.filter((e) => !isEventPast(e, now)), []);
    expect(storyEvents.map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'nn1']);
  });
});
