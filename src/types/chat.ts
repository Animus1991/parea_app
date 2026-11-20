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
  | 'arrival_status'
  | 'gif'
  | 'voice'
  | 'image'
  | 'poll'
  | 'story_reply';

export interface ChatPermissions {
  canRead: boolean;
  canSend: boolean;
  canReport: boolean;
  canPersist: boolean;
  reasonIfLocked?: { el: string; en: string };
}

export interface ChatReplyRef {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  type?: MessageType;
}

export interface ChatMediaAttachment {
  kind: 'gif' | 'image' | 'voice';
  url: string;
  fallbackUrl?: string;
  label?: string;
  durationSec?: number;
  waveform?: number[];
}

export interface ChatPollOption {
  id: string;
  label: string;
  voterIds: string[];
}

export interface ChatPoll {
  id: string;
  question: string;
  options: ChatPollOption[];
}

export interface ChatStoryRef {
  storyId: string;
  authorId: string;
  authorName: string;
  caption?: string;
  bg?: string;
}

export interface ChatStory {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  caption: string;
  imageUrl?: string;
  bgGradient: string;
  createdAt: string;
  expiresAt: string;
  reactions: Record<string, string[]>;
  tag?: string;
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
  /** Threaded reply / reply-to-reply quote. */
  replyTo?: ChatReplyRef;
  /** Emoji -> list of userIds who reacted. */
  reactions?: Record<string, string[]>;
  /** Mentioned userIds (or 'all'). */
  mentions?: string[];
  /** Extracted #tags without leading '#'. */
  tags?: string[];
  media?: ChatMediaAttachment;
  poll?: ChatPoll;
  storyRef?: ChatStoryRef;
  editedAt?: string;
  pinned?: boolean;
  readBy?: string[];
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
