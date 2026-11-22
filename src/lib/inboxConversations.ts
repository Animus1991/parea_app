import type { Event, Group } from '../types';
import type { Conversation } from '../types/chat';

export function selectInboxConversations({
  conversations, groups, events, userId, fallbackTitle,
}: {
  conversations: Conversation[];
  groups: Group[];
  events: Event[];
  userId?: string;
  fallbackTitle: string;
}): Conversation[] {
  if (!userId) return [];
  const visible = conversations.filter((c) => c.status !== 'archived' &&
    (c.participantUserIds.includes(userId) || c.organizerUserId === userId || c.type === 'support'));
  const covered = new Set(visible.map((c) => c.groupId));
  const legacy = groups.filter((g) => g.members.includes(userId) && !covered.has(g.id))
    .map((g): Conversation => ({
      id: `conv_${g.id}`, type: 'event_group', groupId: g.id, eventId: g.eventId,
      title: events.find((e) => e.id === g.eventId)?.title ?? fallbackTitle,
      participantUserIds: g.members, status: 'active', isEphemeral: true, canPersist: true,
      unreadCount: 0, lastMessageAt: '',
      lastMessagePreview: { el: 'Πάτα για συνομιλία', en: 'Tap to open chat' },
      meetingPoint: g.meetingPoint,
    }));
  return [...visible, ...legacy].sort((a, b) => Number(b.unreadCount > 0) - Number(a.unreadCount > 0));
}
