import { describe, expect, it } from 'vitest';
import type { Event, Group } from '../types';
import {
  eventConflictsWithPlans,
  partitionQuietCatalog,
  storiesWithoutFeedDupes,
  userJoinedEvent,
} from './quietCatalog';

const event = (over: Partial<Event> = {}): Event => ({
  id: 'e1',
  title: 'Night',
  category: 'Cinema',
  description: 'x',
  date: '2026-12-04',
  time: '20:00',
  duration: '2h',
  locationArea: 'Athens',
  isPaid: false,
  price: 0,
  organizerId: 'org1',
  safetyLevel: 'low',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 4,
  tags: [],
  ...over,
});

const group = (over: Partial<Group> = {}): Group => ({
  id: 'g1',
  eventId: 'booked',
  members: ['u1'],
  pendingMembers: [],
  targetSize: 4,
  status: 'confirmed',
  discountUnlocked: false,
  ...over,
});

describe('quietCatalog', () => {
  it('treats another night on a booked date as a conflict, not a deletion', () => {
    const booked = event({ id: 'booked', date: '2026-12-04' });
    const clash = event({ id: 'clash', date: '2026-12-04', title: 'Other' });
    const later = event({ id: 'later', date: '2026-12-05' });
    expect(eventConflictsWithPlans(clash, 'u1', [group()], [booked, clash, later])).toBe(true);
    expect(eventConflictsWithPlans(later, 'u1', [group()], [booked, clash, later])).toBe(false);
    expect(userJoinedEvent(booked, 'u1', [group()])).toBe(true);
  });

  it('parks full, joined, conflicting and past nights behind buckets', () => {
    const booked = event({ id: 'booked', date: '2026-12-04' });
    const clash = event({ id: 'clash', date: '2026-12-04' });
    const open = event({ id: 'open', date: '2026-12-06', maxParticipants: 8 });
    const past = event({ id: 'past', date: '2026-05-01' });
    const fullGroup = group({
      id: 'g-full',
      eventId: 'full',
      members: ['a', 'b', 'c', 'd'],
      targetSize: 4,
    });
    const full = event({ id: 'full', date: '2026-12-07', maxParticipants: 4 });
    const buckets = partitionQuietCatalog([open, clash, booked, past, full], {
      userId: 'u1',
      groups: [group(), fullGroup],
      catalog: [open, clash, booked, past, full],
      hidePast: true,
      now: new Date('2026-11-19T12:00:00'),
    });
    expect(buckets.primary.map((e) => e.id)).toEqual(['open']);
    expect(buckets.conflicts.map((e) => e.id)).toEqual(['clash']);
    expect(buckets.fullJoined.map((e) => e.id).sort()).toEqual(['booked', 'full']);
    expect(buckets.past.map((e) => e.id)).toEqual(['past']);
  });

  it('keeps the story rail but drops nights already on the feed', () => {
    const a = event({ id: 'a' });
    const b = event({ id: 'b' });
    const c = event({ id: 'c' });
    expect(storiesWithoutFeedDupes([a, b, c], new Set(['a'])).map((e) => e.id)).toEqual(['b', 'c']);
  });
});
