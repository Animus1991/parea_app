import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './index';
import { isOrganizerUser } from '../lib/roles';

describe('loyalty & organizer guards', () => {
  beforeEach(() => {
    useStore.getState().enterDemoMode();
    useStore.getState().exitDemoMode();
    useStore.getState().enterDemoMode();
  });

  it('promotes member to organizer when creating an event so /manage opens', () => {
    const before = useStore.getState().currentUser!;
    expect(isOrganizerUser({ isOrganizer: false, isAdmin: false })).toBe(false);
    expect(isOrganizerUser({ isOrganizer: false, isAdmin: true })).toBe(true);

    useStore.setState({
      currentUser: { ...before, isOrganizer: false, isAdmin: false },
    });
    expect(isOrganizerUser(useStore.getState().currentUser)).toBe(false);

    useStore.getState().createEvent({
      title: 'Test Coffee Meetup',
      category: 'Food & Drink',
      date: '2026-12-01',
      time: '18:00',
      locationArea: 'Athens',
      description: 'Quick coffee',
      maxParticipants: 4,
      isPaid: false,
      price: 0,
      imageUrl: '',
      tags: ['coffee'],
    });

    const after = useStore.getState().currentUser!;
    expect(after.isOrganizer).toBe(true);
    expect(isOrganizerUser(after)).toBe(true);
  });

  it('restores a declined connection request on Undo unless the sender was blocked', () => {
    const me = useStore.getState().currentUser!.id;
    const reqId = 'cr_undo_test';
    useStore.setState((s) => ({
      connectionRequests: [
        ...s.connectionRequests,
        {
          id: reqId,
          fromUserId: 'u2',
          toUserId: me,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    useStore.getState().declineConnectionRequest(reqId);
    expect(useStore.getState().connectionRequests.find((r) => r.id === reqId)?.status).toBe('declined');

    useStore.getState().restoreConnectionRequest(reqId);
    expect(useStore.getState().connectionRequests.find((r) => r.id === reqId)?.status).toBe('pending');

    useStore.getState().declineConnectionRequest(reqId);
    useStore.getState().blockUser('u2');
    useStore.getState().restoreConnectionRequest(reqId);
    expect(useStore.getState().connectionRequests.find((r) => r.id === reqId)).toBeUndefined();
  });
});
