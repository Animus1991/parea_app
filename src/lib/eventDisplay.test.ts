import { describe, expect, it } from 'vitest';
import {
  formatEventPrice,
  formatLocationArea,
  locationMatchesQuery,
  getEventJoinState,
  isEventImminent,
  isEventPast,
  isLiveCatalogEvent,
  showNightCoordinationTools,
  translateEventTag,
} from './eventDisplay';
import type { Event, Group, User } from '../types';

const event = (over: Partial<Event> = {}): Event => ({
  id: 'e4',
  title: 'Summer Cinema: Cine Thisio',
  category: 'Cinema',
  description: 'Open-air',
  date: '2026-05-14',
  time: '20:45',
  duration: '2h',
  locationArea: 'Thisio, Athens',
  isPaid: true,
  price: 8.5,
  organizerId: 'u2',
  safetyLevel: 'low',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 10,
  tags: ['cinema', 'open-air'],
  ...over,
});

describe('eventDisplay', () => {
  it('keeps cancelled and archived nights off browse lists', () => {
    expect(isLiveCatalogEvent(event())).toBe(true);
    expect(isLiveCatalogEvent(event({ status: 'cancelled' }))).toBe(false);
    expect(isLiveCatalogEvent(event({ status: 'archived' }))).toBe(false);
  });

  it('treats a finished night as past and a later night as upcoming', () => {
    const now = new Date('2026-11-18T14:00:00');
    expect(isEventPast(event(), now)).toBe(true);
    expect(isEventPast(event({ date: '2026-12-01' }), now)).toBe(false);
  });

  it('treats tonight and the next 24 hours as imminent, not a date two weeks out', () => {
    const now = new Date('2026-11-18T14:00:00');
    expect(isEventImminent(event({ date: '2026-11-18', time: '21:00' }), now)).toBe(true);
    expect(isEventImminent(event({ date: '2026-11-19', time: '10:00' }), now)).toBe(true);
    expect(isEventImminent(event({ date: '2026-12-01', time: '20:00' }), now)).toBe(false);
    expect(isEventImminent(event({ date: '2026-11-17', time: '20:00' }), now)).toBe(false);
  });

  it('keeps night tools off browsing cards and on for members that night', () => {
    const now = new Date('2026-11-18T14:00:00');
    const tonight = event({ date: '2026-11-18', time: '21:00' });
    const later = event({ date: '2026-12-01', time: '21:00' });
    expect(showNightCoordinationTools({ inGroup: false, event: tonight, now })).toBe(false);
    expect(showNightCoordinationTools({ inGroup: true, event: later, now })).toBe(false);
    expect(showNightCoordinationTools({ inGroup: true, event: tonight, now })).toBe(true);
    expect(showNightCoordinationTools({ inGroup: false, event: later, alreadyActive: true, now })).toBe(true);
  });

  it('formats Greek euro amounts with a decimal comma', () => {
    expect(formatEventPrice(event(), 'el')).toBe('8,50\u00a0€');
    expect(formatEventPrice(event(), 'en')).toBe('€8.50');
    expect(formatEventPrice(event({ isPaid: false, price: 0 }), 'el')).toBe('Δωρεάν');
  });

  it('localizes Athens neighbourhoods and event tags', () => {
    expect(formatLocationArea('Thisio, Athens', 'el')).toBe('Θησείο, Αθήνα');
    expect(formatLocationArea('Thisio, Athens', 'en')).toBe('Thisio, Athens');
    expect(formatLocationArea('Koukaki, Athens', 'el')).toBe('Κουκάκι, Αθήνα');
    expect(formatLocationArea('Zappeio, Athens', 'el')).toBe('Ζάππειο, Αθήνα');
    expect(formatLocationArea('Plaka, Athens', 'el')).toBe('Πλάκα, Αθήνα');
    expect(formatLocationArea('Syntagma, Athens', 'el')).toBe('Σύνταγμα, Αθήνα');
    expect(locationMatchesQuery('Thisio, Athens', 'θησείο', 'el')).toBe(true);
    expect(locationMatchesQuery('Thisio, Athens', 'thisio', 'el')).toBe(true);
    expect(locationMatchesQuery('Athens', 'αθήνα', 'el')).toBe(true);
    expect(locationMatchesQuery('Thisio, Athens', 'κουκάκι', 'el')).toBe(false);
    expect(translateEventTag('boardgames', (el) => el)).toBe('Επιτραπέζια');
    expect(translateEventTag('board games', (_el, en) => en)).toBe('Board games');
    expect(translateEventTag('nakamas nights', (el) => el)).toBe('Nakamas Nights');
  });

  it('ties the card action to date and membership, not the title', () => {
    const user = { id: 'u1' } as User;
    const group: Group = {
      id: 'g2',
      eventId: 'e4',
      hostId: 'u1',
      members: ['u1', 'u2'],
      pendingMembers: [],
      targetSize: 7,
      status: 'confirmed',
      discountUnlocked: false,
    };
    const now = new Date('2026-11-18T14:00:00');
    expect(
      getEventJoinState(event(), { currentUser: user, groups: [group], pendingFeedbackId: 'e4', now }),
    ).toBe('rate');
    expect(
      getEventJoinState(event({ date: '2026-12-01' }), {
        currentUser: user,
        groups: [group],
        pendingFeedbackId: null,
        now,
      }),
    ).toBe('chat');
    expect(
      getEventJoinState(event({ date: '2026-12-01', id: 'e30' }), {
        currentUser: user,
        groups: [group],
        pendingFeedbackId: null,
        now,
      }),
    ).toBe('join');
  });

  it('keeps a plan later today upcoming (date and time, not date alone)', () => {
    const morning = new Date(2026, 10, 21, 9, 6);
    expect(isEventPast({ date: '2026-11-21', time: '11:00' }, morning)).toBe(false);
    expect(isEventPast({ date: '2026-11-21', time: '08:00' }, morning)).toBe(true);
    expect(isEventPast({ date: '2026-11-20', time: '23:30' }, morning)).toBe(true);
  });
});
