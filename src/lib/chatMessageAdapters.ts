import type { ChatMessage, MessageType } from '../types/chat';
import type { GroupChatMessage } from '../hooks/useGroupChatMessages';

/** Map popup/chatStore messages → full-page GroupChat UI model. */
export function toGroupChatMessage(
  msg: ChatMessage,
  resolveName: (senderId: string) => string,
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
    senderName: msg.senderType === 'system' ? 'System' : resolveName(msg.senderId),
    text: msg.body,
    timestamp: msg.createdAt,
    type,
  };
}

/** Map full-page GroupChat message → chatStore ChatMessage. */
export function toChatMessage(
  msg: GroupChatMessage,
  conversationId: string,
): ChatMessage {
  const type: MessageType =
    msg.type === 'system' ? 'system' : msg.type === 'location' ? 'meeting_point' : 'text';

  return {
    id: msg.id,
    conversationId,
    senderId: msg.senderId,
    senderType: msg.type === 'system' || msg.senderId === 'system' ? 'system' : 'user',
    type,
    body: msg.text,
    createdAt: msg.timestamp,
  };
}

export function conversationIdForGroup(groupId: string): string {
  return `conv_${groupId}`;
}
