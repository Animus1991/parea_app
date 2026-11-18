import { describe, it, expect } from 'vitest';
import { explainEventMatch } from './matchingExplain';
import type { Event, User } from '../types';

const user: User = {
  id: 'u1',
  name: 'Test',
  ageRange: '25-30',
  city: 'Athens',
  interests: ['Theatre', 'Cinema'],
  trustTier: '2_confirmed',
  reliabilityScore: 80,
  badges: [],
  emailVerified: true,
  phoneVerified: true,
  paymentVerified: false,
  idVerified: false,
  isOrganizer: false,
};

const event: Event = {
  id: 'e1',
  title: 'Show',
  category: 'Theatre',
  tags: ['Theatre', 'Culture'],
  description: 'Test',
  date: '2026-12-01',
  time: '20:00',
  duration: '2h',
  locationArea: 'Athens',
  isPaid: false,
  price: 0,
  organizerId: 'org1',
  safetyLevel: 'medium',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 6,
};

describe('explainEventMatch', () => {
  it('returns score and shared strengths for overlapping tags', () => {
    const result = explainEventMatch(user, event, 'en');
    expect(result.score).toBeGreaterThan(50);
    expect(result.sharedStrengths.length).toBeGreaterThan(0);
  });
});

describe('explainEventMatch across languages', () => {
  it('counts a Greek-stored interest as shared and localizes the names', () => {
    const greekUser = { ...user, interests: ['Θέατρο'] };
    const event: Event = {
      id: 'e9',
      title: 'Stage Night',
      category: 'Culture',
      tags: ['Theatre'],
      description: '',
      date: '2027-01-01',
      time: '21:00',
      duration: '2h',
      locationArea: 'Gazi, Athens',
      isPaid: false,
      price: 0,
    } as Event;
    const el = explainEventMatch(greekUser, event, 'el');
    expect(el.sharedStrengths[0]).toContain('Θέατρο');
    const en = explainEventMatch(greekUser, event, 'en');
    expect(en.sharedStrengths[0]).toContain('Theatre');
  });
});
