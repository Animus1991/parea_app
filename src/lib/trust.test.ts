import { describe, expect, it } from 'vitest';
import { canAccessEvent, computeReliabilityDelta } from './trust';
import type { Event, User } from '../types';

const event = (tier: Event['minTrustTierAccess']): Event =>
  ({
    id: 'e1',
    title: 'Test',
    category: 'Social',
    description: '',
    date: '2026-12-01',
    time: '20:00',
    duration: '2h',
    locationArea: 'Athens',
    isPaid: false,
    price: 0,
    organizerId: 'u2',
    safetyLevel: 'low',
    minTrustTierAccess: tier,
    maxParticipants: 8,
    tags: [],
  }) as Event;

const user = (tier: User['trustTier']): User =>
  ({
    id: 'u1',
    name: 'Ada',
    trustTier: tier,
    emailVerified: true,
    phoneVerified: true,
  }) as User;

describe('canAccessEvent', () => {
  it('lets a confirmed member into a confirmed outing without mentioning ID', () => {
    const gate = canAccessEvent(user('2_confirmed'), event('2_confirmed'));
    expect(gate.allowed).toBe(true);
  });

  it('asks for email and phone, not a trust sermon, when the outing needs confirmation', () => {
    const gate = canAccessEvent(user('1_explorer'), event('2_confirmed'));
    expect(gate.allowed).toBe(false);
    expect(gate.messageEn).toMatch(/email and phone/i);
    expect(gate.messageEn).not.toMatch(/trust level/i);
  });

  it('reserves ID language for hosting-level outings', () => {
    const gate = canAccessEvent(user('2_confirmed'), event('3_high_trust'));
    expect(gate.allowed).toBe(false);
    expect(gate.messageEn).toMatch(/hosting/i);
    expect(gate.messageEl).toMatch(/διοργάνωση/i);
  });
});

describe('computeReliabilityDelta', () => {
  it('does not punish the rater for a no-show flag on the mood form', () => {
    expect(computeReliabilityDelta({ overallRating: 5 })).toBe(2);
    expect(computeReliabilityDelta({ overallRating: 3 })).toBe(0);
  });
});
