import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './index';

describe('lean privacy store', () => {
  beforeEach(() => {
    const s = useStore.getState();
    s.login('u1');
    useStore.setState({
      blockedUserIds: [],
      userSettings: {
        ...s.userSettings,
        privacy: {
          profileVisibility: 'public',
          messagePermission: 'everyone',
          shareLocation: true,
          revealPhoto: true,
          allowMutualPing: true,
          allowOrganizerMsg: true,
        },
      },
    });
  });

  it('denormalizes privacy onto currentUser and users[]', () => {
    useStore.getState().updatePrivacySettings({ profileVisibility: 'connections' });
    const state = useStore.getState();
    expect(state.userSettings.privacy.profileVisibility).toBe('connections');
    expect(state.currentUser?.privacy?.profileVisibility).toBe('connections');
    expect(state.users.find((u) => u.id === 'u1')?.privacy?.profileVisibility).toBe('connections');
  });

  it('blocks a user and removes the connection edge', () => {
    const peer = useStore.getState().users.find((u) => u.id !== 'u1');
    expect(peer).toBeTruthy();
    // Ensure connected
    useStore.setState((st) => ({
      currentUser: st.currentUser
        ? { ...st.currentUser, connections: [...new Set([...(st.currentUser.connections ?? []), peer!.id])] }
        : null,
      users: st.users.map((u) =>
        u.id === 'u1'
          ? { ...u, connections: [...new Set([...(u.connections ?? []), peer!.id])] }
          : u.id === peer!.id
            ? { ...u, connections: [...new Set([...(u.connections ?? []), 'u1'])] }
            : u,
      ),
    }));
    useStore.getState().blockUser(peer!.id);
    const state = useStore.getState();
    expect(state.blockedUserIds).toContain(peer!.id);
    expect(state.currentUser?.connections ?? []).not.toContain(peer!.id);
  });

  it('gates organizer contact when allowOrganizerMsg is false on subject', () => {
    const org = useStore.getState().users.find((u) => u.isOrganizer);
    expect(org).toBeTruthy();
    useStore.setState((st) => ({
      users: st.users.map((u) =>
        u.id === org!.id
          ? {
              ...u,
              privacy: {
                profileVisibility: 'public',
                messagePermission: 'everyone',
                shareLocation: true,
                revealPhoto: true,
                allowMutualPing: true,
                allowOrganizerMsg: false,
              },
            }
          : u,
      ),
    }));
    const res = useStore.getState().sendOrganizerMessage(org!.id, 'hello');
    expect(res.ok).toBe(false);
  });
});
