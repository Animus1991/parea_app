import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './index';

/**
 * A full group is ready whether or not its event has a group discount.
 * Before the fix only discount events could confirm, so for most events a
 * full group stayed «pending» and «Our night» never revealed its details.
 */
describe('group confirmation', () => {
  beforeEach(() => {
    useStore.getState().enterDemoMode();
    useStore.getState().exitDemoMode();
    useStore.getState().enterDemoMode();
  });

  function seedGroup(discount: boolean) {
    const s = useStore.getState();
    const base = s.events[0];
    const eventId = 'e_confirm_test';
    const event = {
      ...base,
      id: eventId,
      status: 'active' as const,
      groupDiscount: discount ? { minSize: 2, percentage: 10 } : undefined,
    };
    const others = s.users.filter((u) => u.id !== s.currentUser?.id).slice(0, 2).map((u) => u.id);
    const group = {
      id: 'g_confirm_test',
      eventId,
      members: [others[0]],
      targetSize: 3,
      status: 'pending' as const,
    };
    useStore.setState({ events: [...s.events, event], groups: [...s.groups, group as never] });
    return { groupId: group.id, others };
  }

  it('confirms a full group on an event without a discount', () => {
    const { groupId, others } = seedGroup(false);
    useStore.getState().addMemberToGroup(groupId, others[1]);
    expect(useStore.getState().groups.find((g) => g.id === groupId)?.status).toBe('pending');
    const me = useStore.getState().currentUser!.id;
    useStore.getState().addMemberToGroup(groupId, me);
    const g = useStore.getState().groups.find((x) => x.id === groupId)!;
    expect(g.status).toBe('confirmed');
    expect(g.discountUnlocked).toBeFalsy();
    expect(g.code).toBeUndefined();
    const ready = useStore.getState().notifications.find((n) => n.groupId === groupId && /έτοιμη/.test(n.messageGr ?? ''));
    expect(ready?.messageGr).not.toMatch(/κωδικός ομάδας/);
  });

  it('still unlocks the discount and its code, and promises the code', () => {
    const { groupId, others } = seedGroup(true);
    useStore.getState().addMemberToGroup(groupId, others[1]);
    let g = useStore.getState().groups.find((x) => x.id === groupId)!;
    expect(g.discountUnlocked).toBe(true);
    expect(g.code).toMatch(/^PAREA-/);
    expect(g.status).toBe('pending');
    useStore.getState().addMemberToGroup(groupId, useStore.getState().currentUser!.id);
    g = useStore.getState().groups.find((x) => x.id === groupId)!;
    expect(g.status).toBe('confirmed');
    const ready = useStore.getState().notifications.find((n) => n.groupId === groupId && /έτοιμη/.test(n.messageGr ?? ''));
    expect(ready?.messageGr).toMatch(/κωδικός ομάδας/);
  });

  it('never revives a cancelled group', () => {
    const { groupId, others } = seedGroup(false);
    useStore.setState({ groups: useStore.getState().groups.map((g) => (g.id === groupId ? { ...g, status: 'cancelled' as const } : g)) });
    const before = useStore.getState().groups.find((g) => g.id === groupId)!.members.slice();
    useStore.getState().addMemberToGroup(groupId, others[1]);
    useStore.getState().addMemberToGroup(groupId, useStore.getState().currentUser!.id);
    useStore.getState().joinGroup(groupId);
    const after = useStore.getState().groups.find((g) => g.id === groupId)!;
    expect(after.status).toBe('cancelled');
    expect(after.members).toEqual(before);
  });
});
