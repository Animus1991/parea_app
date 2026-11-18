import { describe, expect, it } from 'vitest';
import {
  formatEventPrice,
  formatLocationArea,
  getEventJoinState,
  isEventPast,
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
  it('treats a finished night as past and a later night as upcoming', () => {
    const now = new Date('2026-11-18T14:00:00');
    expect(isEventPast(event(), now)).toBe(true);
    expect(isEventPast(event({ date: '2026-12-01' }), now)).toBe(false);
  });

  it('formats Greek euro amounts with a decimal comma', () => {
    expect(formatEventPrice(event(), 'el')).toBe('8,50 €');
    expect(formatEventPrice(event(), 'en')).toBe('€8.50');
    expect(formatEventPrice(event({ isPaid: false, price: 0 }), 'el')).toBe('Δωρεάν');
  });

  it('localizes Athens neighbourhoods and event tags', () => {
    expect(formatLocationArea('Thisio, Athens', 'el')).toBe('Θησείο, Αθήνα');
    expect(formatLocationArea('Thisio, Athens', 'en')).toBe('Thisio, Athens');
    expect(translateEventTag('boardgames', (el) => el)).toBe('Επιτραπέζια');
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
});
