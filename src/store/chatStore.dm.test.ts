import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from './chatStore';

describe('ensureDirectConversation', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      messages: [],
      openConversationIds: [],
      privacy: {
        ...useChatStore.getState().privacy,
        allowMutualConnectionChats: true,
      },
    });
  });

  it('creates a stable 1:1 persistent conversation and opens it', () => {
    const id = useChatStore.getState().ensureDirectConversation({
      selfUserId: 'u2',
      peerUserId: 'u1',
      peerName: 'Alex',
      openWindow: true,
    });
    expect(id).toBe('conv_dm_u1_u2');
    const conv = useChatStore.getState().conversations.find((c) => c.id === id);
    expect(conv?.type).toBe('direct');
    expect(conv?.status).toBe('persistent');
    expect(conv?.isEphemeral).toBe(false);
    expect(useChatStore.getState().openConversationIds).toContain(id!);
  });

  it('returns existing conversation on second call', () => {
    const a = useChatStore.getState().ensureDirectConversation({
      selfUserId: 'u1',
      peerUserId: 'u3',
      peerName: 'Sam',
      openWindow: false,
    });
    const b = useChatStore.getState().ensureDirectConversation({
      selfUserId: 'u3',
      peerUserId: 'u1',
      peerName: 'Sam',
      openWindow: false,
    });
    expect(a).toBe(b);
    expect(useChatStore.getState().conversations.filter((c) => c.type === 'direct')).toHaveLength(1);
  });

  it('returns null when mutual DMs are disabled', () => {
    useChatStore.setState({
      privacy: {
        ...useChatStore.getState().privacy,
        allowMutualConnectionChats: false,
      },
    });
    const id = useChatStore.getState().ensureDirectConversation({
      selfUserId: 'u1',
      peerUserId: 'u2',
      peerName: 'Alex',
    });
    expect(id).toBeNull();
  });
});
