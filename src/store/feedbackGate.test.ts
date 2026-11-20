import { beforeEach, describe, expect, it } from 'vitest';
import type { Event, Group } from '../types';
import { FEEDBACK_JOIN_SKIP_LIMIT } from '../lib/feedbackDue';
import { useStore } from './index';

function reset() {
  useStore.getState().enterDemoMode();
  useStore.getState().exitDemoMode();
  useStore.getState().enterDemoMode();
}

const pastEvent = (id: string): Event =>
  ({
    id,
    title: id,
    category: 'Social',
    description: '',
    date: '2026-11-01',
    time: '20:00',
    duration: '2h',
    locationArea: 'Athens',
    isPaid: false,
    price: 0,
    organizerId: 'u2',
    safetyLevel: 'low',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 8,
  }) as Event;

const memberGroup = (eventId: string): Group =>
  ({
    id: `g-${eventId}`,
    eventId,
    members: ['u1'],
    pendingMembers: [],
    targetSize: 4,
    status: 'confirmed',
    discountUnlocked: false,
  }) as Group;

describe('discreet feedback join gate', () => {
  beforeEach(reset);

  it('keeps join open with a single due night', () => {
    const s = useStore.getState();
    expect(s.getPendingFeedbackEventId()).toBe('e4');
    expect(s.getPendingFeedbackEventIds()).toEqual(['e4']);
    const gate = s.canJoinEvent('nn2');
    expect(gate.reason).not.toBe('feedback');
  });

  it('blocks join only after three skipped nights', () => {
    const extras = ['past-fb-1', 'past-fb-2'].map(pastEvent);
    useStore.setState((st) => ({
      events: [...st.events, ...extras],
      groups: [...st.groups, ...extras.map((e) => memberGroup(e.id))],
    }));
    const s = useStore.getState();
    expect(s.getPendingFeedbackEventIds().length).toBeGreaterThanOrEqual(FEEDBACK_JOIN_SKIP_LIMIT);
    const gate = s.canJoinEvent('nn2');
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe('feedback');
    expect(gate.messageEn).toMatch(/previous night/i);
    expect(`${gate.messageEl} ${gate.messageEn}`).not.toMatch(/unlock|ξεκλειδ/i);
  });
});
