import { describe, expect, it } from 'vitest';
import { useStore } from './index';
import { useWallStore } from './wallStore';
import { useChatStore } from './chatStore';
import { mockWallPosts } from '../data/mockWall';
import { mockConversations } from '../data/mockChatData';

describe('demo exit keeps its promise («τα demo δεδομένα χάνονται με την Έξοδο»)', () => {
  it('restores demo data in every store and keeps preferences', () => {
    const s = useStore.getState();
    s.setTheme('neon-dark');
    s.enterDemoMode();
    s.toggleSavedEvent('e1');
    s.blockUser('u3');
    useWallStore.getState().createPost({ text: 'demo post' });
    useChatStore.setState({ conversations: [] });

    useStore.getState().exitDemoMode();

    const after = useStore.getState();
    expect(after.demoMode).toBe(false);
    expect(after.currentUser).toBeNull();
    expect(after.savedEvents).toEqual(['e4', 'e3']);
    expect(after.blockedUserIds).toEqual([]);
    expect(after.users.find((u) => u.id === 'u3')?.connections).toContain('u1');
    expect(after.theme).toBe('neon-dark');
    expect(useWallStore.getState().posts.map((p) => p.id)).toEqual(mockWallPosts.map((p) => p.id));
    expect(useChatStore.getState().conversations.length).toBe(mockConversations.length);
  });

  it('leaves a signed-in (non-demo) account’s data alone', () => {
    useStore.getState().login('u1');
    useStore.getState().toggleSavedEvent('e9');
    useStore.getState().exitDemoMode();
    expect(useStore.getState().savedEvents).toContain('e9');
  });
});
