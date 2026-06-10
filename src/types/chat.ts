export type ConversationType =
  | 'event_group'
  | 'direct'
  | 'person_to_group'
  | 'group_to_person'
  | 'group_to_group'
  | 'organizer_announcement'
  | 'support';

export type ConversationStatus =
  | 'locked'
  | 'pending'
  | 'active'
  | 'muted'
  | 'archived'
  | 'expired'
  | 'persistent'
  | 'frozen'
  | 'reported';

export type MessageSenderType = 'user' | 'organizer' | 'system' | 'admin';

export type MessageType =
  | 'text'
  | 'system'
  | 'event_card'
  | 'meeting_point'
  | 'quick_reply'
  | 'arrival_status';

export interface ChatPermissions {
  canRead: boolean;
  canSend: boolean;
  canReport: boolean;
  canPersist: boolean;
  reasonIfLocked?: { el: string; en: string };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  eventId?: string;
  groupId?: string;
  relatedGroupIds?: string[];
  participantUserIds: string[];
  organizerUserId?: string;
  status: ConversationStatus;
  isEphemeral: boolean;
  expiresAt?: string;
  canPersist: boolean;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: { el: string; en: string };
  muted?: boolean;
  meetingPoint?: string;
  /** Φ17 — user asked to keep this ephemeral chat beyond its expiry. */
  keepRequested?: boolean;
  /** Φ17 — user announced arrival at the meeting point. */
  arrivedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: MessageSenderType;
  type: MessageType;
  body: string;
  createdAt: string;
}

export interface ChatPrivacySettings {
  allowMutualConnectionChats: boolean;
  allowGroupChats: boolean;
  allowOrganizerMessages: boolean;
  allowGroupMergeChats: boolean;
  autoExpireEventChats: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  showMessagePreviews: boolean;
  requireApprovalForDirectChat: boolean;
}

export const DEFAULT_CHAT_PRIVACY: ChatPrivacySettings = {
  allowMutualConnectionChats: true,
  allowGroupChats: true,
  allowOrganizerMessages: true,
  allowGroupMergeChats: true,
  autoExpireEventChats: true,
  showReadReceipts: false,
  showTypingIndicators: true,
  showMessagePreviews: true,
  requireApprovalForDirectChat: true,
};
