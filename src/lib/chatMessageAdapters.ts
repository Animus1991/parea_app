import type { ChatMessage, MessageType } from '../types/chat';
import type { GroupChatMessage } from '../hooks/useGroupChatMessages';

/** Map popup/chatStore messages → full-page GroupChat UI model (preserving rich metadata). */
export function toGroupChatMessage(
  msg: ChatMessage,
  resolveName: (senderId: string) => string,
  systemLabel = 'System',
): GroupChatMessage {
  const type: GroupChatMessage['type'] =
    msg.type === 'system' || msg.type === 'arrival_status'
      ? 'system'
      : msg.type === 'meeting_point'
        ? 'location'
        : 'text';

  return {
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.senderType === 'system' ? systemLabel : resolveName(msg.senderId),
    text: msg.body,
    timestamp: msg.createdAt,
    type,
    richType: msg.type,
    replyTo: msg.replyTo,
    reactions: msg.reactions,
    mentions: msg.mentions,
    tags: msg.tags,
    media: msg.media,
    poll: msg.poll,
    storyRef: msg.storyRef,
    editedAt: msg.editedAt,
    pinned: msg.pinned,
    readBy: msg.readBy,
  };
}

/** Map full-page GroupChat message → chatStore ChatMessage. */
export function toChatMessage(
  msg: GroupChatMessage,
  conversationId: string,
): ChatMessage {
  const type: MessageType =
    msg.richType ??
    (msg.type === 'system' ? 'system' : msg.type === 'location' ? 'meeting_point' : 'text');

  return {
    id: msg.id,
    conversationId,
    senderId: msg.senderId,
    senderType: msg.type === 'system' || msg.senderId === 'system' ? 'system' : 'user',
    type,
    body: msg.text,
    createdAt: msg.timestamp,
    ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
    ...(msg.reactions ? { reactions: msg.reactions } : {}),
    ...(msg.mentions ? { mentions: msg.mentions } : {}),
    ...(msg.tags ? { tags: msg.tags } : {}),
    ...(msg.media ? { media: msg.media } : {}),
    ...(msg.poll ? { poll: msg.poll } : {}),
    ...(msg.storyRef ? { storyRef: msg.storyRef } : {}),
    ...(msg.editedAt ? { editedAt: msg.editedAt } : {}),
    ...(msg.pinned ? { pinned: msg.pinned } : {}),
    ...(msg.readBy ? { readBy: msg.readBy } : {}),
  };
}

export function conversationIdForGroup(groupId: string): string {
  return `conv_${groupId}`;
}
