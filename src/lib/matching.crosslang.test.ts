import { describe, expect, it } from 'vitest';
import { computeMatchScore } from './matching';
import type { Event, User } from '../types';

/**
 * Interests typed or stored in Greek must match English event tags the same
 * way their English ids do (docs/AUDIT_FIXES §9.3 and §10).
 */

function makeUser(interests: string[]): User {
  return {
    id: 'u1',
    name: 'Test',
    ageRange: '25-30',
    city: 'Athens',
    interests,
    trustTier: '2_confirmed',
    reliabilityScore: 80,
    badges: [],
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: false,
  };
}

const event: Event = {
  id: 'e1',
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

describe('computeMatchScore across languages', () => {
  it('scores a Greek-stored interest like its English id', () => {
    const greek = computeMatchScore(makeUser(['Θέατρο']), event);
    const english = computeMatchScore(makeUser(['Theatre']), event);
    expect(greek).toBe(english);
    expect(greek).toBeGreaterThan(computeMatchScore(makeUser(['Hiking']), event));
  });
});
