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

describe('ensureEventGroupConversation', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      messages: [],
      openConversationIds: [],
    });
  });

  it('creates an event-group thread with a translatable welcome and meeting point', () => {
    const id = useChatStore.getState().ensureEventGroupConversation({
      groupId: 'g-nn1',
      eventId: 'nn1',
      title: 'Nakamas Nights: Ιστορίες στο τραπέζι',
      participantUserIds: ['u1', 'u2', 'u3', 'u4'],
      meetingPoint: 'Μπαρ Ψυρρή, Aisopou 8',
    });
    expect(id).toBe('conv_g-nn1');
    const conv = useChatStore.getState().conversations.find((c) => c.id === id);
    expect(conv?.type).toBe('event_group');
    expect(conv?.meetingPoint).toBe('Μπαρ Ψυρρή, Aisopou 8');
    expect(conv?.lastMessagePreview.el).toMatch(/συντονισμού/);
    const bodies = useChatStore.getState().messages
      .filter((m) => m.conversationId === id)
      .map((m) => m.body);
    expect(bodies).toEqual(['sys.coordination_unlocked']);
  });

  it('returns the existing conversation and does not duplicate the welcome', () => {
    const a = useChatStore.getState().ensureEventGroupConversation({
      groupId: 'g-x',
      eventId: 'e-x',
      title: 'Test',
      participantUserIds: ['u1'],
    });
    const b = useChatStore.getState().ensureEventGroupConversation({
      groupId: 'g-x',
      eventId: 'e-x',
      title: 'Test',
      participantUserIds: ['u1'],
    });
    expect(a).toBe(b);
    expect(
      useChatStore.getState().messages.filter((m) => m.conversationId === a && m.type === 'system'),
    ).toHaveLength(1);
  });
});

describe('announceArrival', () => {
  const baseConv = {
    id: 'c-arrive',
    type: 'event_group' as const,
    title: 'Cinema',
    participantUserIds: ['u2'],
    status: 'active' as const,
    isEphemeral: true,
    canPersist: true,
    unreadCount: 0,
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessagePreview: { el: '', en: '' },
  };

  beforeEach(() => {
    useChatStore.setState({
      conversations: [baseConv],
      messages: [],
    });
  });

  it('posts an arrival only for a participant who can send', () => {
    expect(useChatStore.getState().announceArrival('c-arrive', 'u2')).toBe(true);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().conversations[0].arrivedAt).toBeTruthy();
  });

  it('ignores outsiders and locked threads', () => {
    expect(useChatStore.getState().announceArrival('c-arrive', 'u1')).toBe(false);
    useChatStore.setState({ conversations: [{ ...baseConv, status: 'locked' }] });
    expect(useChatStore.getState().announceArrival('c-arrive', 'u2')).toBe(false);
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});
