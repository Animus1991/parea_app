import { describe, expect, it } from 'vitest';
import { selectInboxConversations } from './inboxConversations';
import type { Event, Group } from '../types';
import type { Conversation } from '../types/chat';

const conversation = (id: string, overrides: Partial<Conversation> = {}) => ({
  id, type: 'direct', participantUserIds: ['u1'], status: 'active', unreadCount: 0, ...overrides,
} as Conversation);
const group = (id: string, members = ['u1']) => ({ id, eventId: 'e1', members } as Group);

describe('shared inbox conversations', () => {
  it('merges legacy memberships without duplicating bridged groups and prioritizes unread', () => {
    const result = selectInboxConversations({ userId: 'u1', fallbackTitle: 'Event Nakamas',
      conversations: [conversation('read', { groupId: 'bridged' }), conversation('unread', { unreadCount: 2 })],
      groups: [group('bridged'), group('legacy')], events: [{ id: 'e1', title: 'Workshop' } as Event],
    });
    expect(result.map((c) => c.id)).toEqual(['unread', 'read', 'conv_legacy']);
    expect(result[2]).toMatchObject({ title: 'Workshop', type: 'event_group', groupId: 'legacy', participantUserIds: ['u1'] });
  });

  it('excludes other members and archived threads while retaining support', () => {
    expect(selectInboxConversations({ userId: 'u1', fallbackTitle: 'Event Nakamas', groups: [group('other', ['u2'])], events: [],
      conversations: [conversation('other', { participantUserIds: ['u2'] }), conversation('archived', { status: 'archived' }), conversation('support', { type: 'support', participantUserIds: [] })],
    }).map((c) => c.id)).toEqual(['support']);
  });

  it('handles empty/signed-out data and missing legacy event metadata', () => {
    expect(selectInboxConversations({ fallbackTitle: 'Event Nakamas', conversations: [], groups: [], events: [] })).toEqual([]);
    expect(selectInboxConversations({ userId: 'u1', fallbackTitle: 'Event Nakamas', conversations: [], groups: [group('legacy')], events: [] })[0].title).toBe('Event Nakamas');
  });
});
