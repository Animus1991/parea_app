import { describe, expect, it } from 'vitest';
import {
  meetingPreferenceLabel,
  plansFormingMatchReason,
} from './plansFormingUtils';
import type { CompanyRequest } from '../types/companyRequest';
import type { Event, User } from '../types';

const user = (over: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Alex',
  ageRange: '25-34',
  city: 'Athens',
  interests: ['Food & Drink', 'Festivals'],
  trustTier: '2_confirmed',
  reliabilityScore: 80,
  badges: [],
  emailVerified: true,
  phoneVerified: true,
  paymentVerified: false,
  idVerified: false,
  isOrganizer: false,
  ...over,
});

const event = (over: Partial<Event> = {}): Event => ({
  id: 'e2',
  title: 'Athens Street Food Festival 2026',
  category: 'Food & Drink',
  description: '',
  date: '2026-11-23',
  time: '17:00',
  duration: '3h',
  locationArea: 'Gazi, Athens',
  isPaid: false,
  price: 0,
  organizerId: 'u3',
  safetyLevel: 'low',
  minTrustTierAccess: '1_explorer',
  maxParticipants: 8,
  ...over,
});

const request = (over: Partial<CompanyRequest> = {}): CompanyRequest => ({
  id: 'cr4',
  creatorUserId: 'u3',
  eventId: 'e2',
  lookingForType: 'create_group',
  openToJoinGroup: true,
  meetingPreference: 'chat_first',
  visibilityMode: 'similar_interests',
  profileExposure: 'nickname',
  requiredTrustTier: 'none',
  status: 'active',
  createdAt: '2026-05-30T11:00:00.000Z',
  updatedAt: '2026-05-30T11:00:00.000Z',
  ...over,
});

describe('plansFormingUtils copy', () => {
  it('names meeting preferences in one language', () => {
    expect(meetingPreferenceLabel('chat_first')).toEqual({
      el: 'Συνομιλία πρώτα',
      en: 'Chat first',
    });
    expect(meetingPreferenceLabel('coffee_before').el).toBe('Καφές πριν');
  });

  it('localizes the shared-interest reason instead of leaving the English category', () => {
    const reason = plansFormingMatchReason(
      user(),
      user({ id: 'u3', interests: ['Food & Drink'] }),
      event(),
      request(),
      [],
    );
    expect(reason?.el).toContain('Γαστρονομία');
    expect(reason?.el).not.toContain('Food & Drink');
    expect(reason?.en).toContain('Food & Dining');
  });
});
