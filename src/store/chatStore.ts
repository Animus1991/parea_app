import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Conversation,
  ChatMessage,
  ChatPrivacySettings,
  ChatReplyRef,
  ChatMediaAttachment,
  ChatPoll,
  ChatStory,
  ChatStoryRef,
  MessageType,
} from '../types/chat';
import { DEFAULT_CHAT_PRIVACY } from '../types/chat';
import { mockConversations, mockChatMessages, mockChatStories } from '../data/mockChatData';
import { emitChatMessage, joinChatRoom } from '../lib/realtime/socket';
import { isFirebaseConfigured as isFirebaseChatEnabled } from '../lib/firebaseConfig';
import { SYS_COORDINATION_UNLOCKED, SYS_DM_UNLOCKED } from '../lib/chatSystemCopy';

export interface ChatReport {
  id: string;
  conversationId: string;
  messageId?: string;
  reason: string;
  createdAt: string;
  status: 'open' | 'closed';
}

export interface SendRichMessageInput {
  conversationId: string;
  senderId: string;
  body: string;
  type?: MessageType;
  replyTo?: ChatReplyRef;
  mentions?: string[];
  tags?: string[];
  media?: ChatMediaAttachment;
  poll?: ChatPoll;
  storyRef?: ChatStoryRef;
}

interface ChatState {
  conversations: Conversation[];
  messages: ChatMessage[];
  stories: ChatStory[];
  seenStoryIds: string[];
  drafts: Record<string, string>;
  typingByConv: Record<string, boolean>;
  privacy: ChatPrivacySettings;
  inboxOpen: boolean;
  openConversationIds: string[];
  minimizedIds: string[];
  activeWindowIds: string[];
  reportedConversationIds: string[];
  reports: ChatReport[];
  dismissedEphemeralBanners: string[];

  setInboxOpen: (open: boolean) => void;
  toggleInbox: () => void;
  openConversation: (id: string) => void;
  closeConversation: (id: string) => void;
  minimizeConversation: (id: string) => void;
  sendMessage: (conversationId: string, body: string, senderId: string) => void;
  sendRichMessage: (input: SendRichMessageInput) => string;
  /** Φ17 — inbound message (simulated/peer): appends + bumps unreadCount. */
  receiveMessage: (conversationId: string, body: string, senderId: string, type?: ChatMessage['type']) => void;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  editMessage: (messageId: string, newBody: string, userId: string) => void;
  deleteMessage: (messageId: string, userId: string) => ChatMessage | null;
  restoreMessage: (snapshot: ChatMessage) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  votePoll: (messageId: string, optionId: string, userId: string) => void;
  setDraft: (conversationId: string, text: string) => void;
  setTyping: (conversationId: string, typing: boolean) => void;
  addStory: (input: { authorId: string; authorName: string; authorAvatar?: string; caption: string; imageUrl?: string; bgGradient: string; tag?: string }) => string;
  markStorySeen: (storyId: string) => void;
  reactToStory: (storyId: string, emoji: string, userId: string) => void;
  markRead: (conversationId: string) => void;
  muteConversation: (id: string, muted: boolean) => void;
  archiveConversation: (id: string) => void;
  reportConversation: (conversationId: string, reason: string, messageId?: string) => void;
  dismissEphemeralBanner: (conversationId: string) => void;
  undismissEphemeralBanner: (conversationId: string) => void;
  setPrivacy: (patch: Partial<ChatPrivacySettings>) => void;
  totalUnread: () => number;
  /** Φ17 — real keep-chat request: flags the conversation + system message. */
  requestKeepChat: (conversationId: string, userId: string) => void;
  /** Φ17 — "I arrived" at the meeting point: arrival system message. */
  announceArrival: (conversationId: string, userId: string) => boolean;
  ensureEventGroupConversation: (input: {
    groupId: string;
    eventId: string;
    title: string;
    participantUserIds: string[];
    meetingPoint?: string;
    openWindow?: boolean;
  }) => string;
  ensureDirectConversation: (input: {
    selfUserId: string;
    peerUserId: string;
    peerName: string;
    openWindow?: boolean;
  }) => string | null;
}

const MAX_WINDOWS = 2;

function previewForRich(input: SendRichMessageInput): { el: string; en: string } {
  if (input.media?.kind === 'gif') return { el: 'GIF · ' + (input.media.label || 'GIF'), en: 'GIF · ' + (input.media.label || 'GIF') };
  if (input.media?.kind === 'voice') return { el: '🎙️ Φωνητικό μήνυμα', en: '🎙️ Voice message' };
  if (input.media?.kind === 'image') return { el: '📷 Φωτογραφία', en: '📷 Photo' };
  if (input.poll) return { el: `📊 ${input.poll.question}`.slice(0, 80), en: `📊 ${input.poll.question}`.slice(0, 80) };
  if (input.storyRef) return { el: `Απάντηση στο story: ${input.body}`.slice(0, 80), en: `Story reply: ${input.body}`.slice(0, 80) };
  return { el: input.body.slice(0, 80), en: input.body.slice(0, 80) };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: mockConversations,
      messages: mockChatMessages,
      stories: mockChatStories,
      seenStoryIds: [],
      drafts: {},
      typingByConv: {},
      privacy: DEFAULT_CHAT_PRIVACY,
      inboxOpen: false,
      openConversationIds: [],
      minimizedIds: [],
      activeWindowIds: [],
      reportedConversationIds: [],
      reports: [],
      dismissedEphemeralBanners: [],

      setInboxOpen: (open) => set({ inboxOpen: open }),
      toggleInbox: () => set((s) => ({ inboxOpen: !s.inboxOpen })),

      openConversation: (id) => {
        const { activeWindowIds, minimizedIds } = get();
        let next = activeWindowIds.filter((x) => x !== id);
        if (!next.includes(id)) {
          next = [...next, id];
          if (next.length > MAX_WINDOWS) {
            next = next.slice(-MAX_WINDOWS);
          }
        }
        set({
          inboxOpen: false,
          activeWindowIds: next,
          minimizedIds: minimizedIds.filter((x) => x !== id),
          openConversationIds: [...new Set([...get().openConversationIds, id])],
        });
        get().markRead(id);
      },

      closeConversation: (id) =>
        set((s) => ({
          activeWindowIds: s.activeWindowIds.filter((x) => x !== id),
          minimizedIds: s.minimizedIds.filter((x) => x !== id),
        })),

      minimizeConversation: (id) =>
        set((s) => ({
          activeWindowIds: s.activeWindowIds.filter((x) => x !== id),
          minimizedIds: [...new Set([...s.minimizedIds, id])],
        })),

      sendMessage: (conversationId, body, senderId) => {
        get().sendRichMessage({ conversationId, senderId, body, type: 'text' });
      },

      sendRichMessage: (input) => {
        const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const createdAt = new Date().toISOString();
        const msg: ChatMessage = {
          id,
          conversationId: input.conversationId,
          senderId: input.senderId,
          senderType: 'user',
          type: input.type ?? 'text',
          body: input.body,
          createdAt,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
          ...(input.mentions?.length ? { mentions: input.mentions } : {}),
          ...(input.tags?.length ? { tags: input.tags } : {}),
          ...(input.media ? { media: input.media } : {}),
          ...(input.poll ? { poll: input.poll } : {}),
          ...(input.storyRef ? { storyRef: input.storyRef } : {}),
          readBy: [input.senderId],
        };
        const preview = previewForRich(input);
        set((s) => {
          const nextDrafts = { ...s.drafts };
          delete nextDrafts[input.conversationId];
          return {
            messages: [...s.messages, msg],
            drafts: nextDrafts,
            conversations: s.conversations.map((c) =>
              c.id === input.conversationId
                ? {
                    ...c,
                    lastMessageAt: createdAt,
                    lastMessagePreview: preview,
                  }
                : c,
            ),
          };
        });
        const wireBody = input.body || preview.en;
        if (isFirebaseChatEnabled()) {
          void import('../lib/realtime/firebaseChat').then(({ sendFirebaseMessage }) =>
            sendFirebaseMessage(input.conversationId, input.senderId, wireBody),
          );
        } else {
          joinChatRoom(input.conversationId);
          emitChatMessage(input.conversationId, input.senderId, wireBody);
        }
        return id;
      },

      receiveMessage: (conversationId, body, senderId, type = 'text') => {
        const msg: ChatMessage = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          conversationId,
          senderId,
          senderType: senderId === 'system' ? 'system' : 'user',
          type,
          body,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessageAt: msg.createdAt,
                  lastMessagePreview: { el: body.slice(0, 80), en: body.slice(0, 80) },
                  unreadCount: get().activeWindowIds.includes(conversationId)
                    ? c.unreadCount
                    : c.unreadCount + 1,
                }
              : c,
          ),
        }));
      },

      toggleReaction: (messageId, emoji, userId) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== messageId) return m;
            const prev = { ...(m.reactions ?? {}) };
            const list = prev[emoji] ?? [];
            const next = list.includes(userId)
              ? list.filter((id) => id !== userId)
              : [...list, userId];
            if (next.length === 0) delete prev[emoji];
            else prev[emoji] = next;
            return { ...m, reactions: prev };
          }),
        })),

      editMessage: (messageId, newBody, userId) => {
        const trimmed = newBody.trim();
        if (!trimmed) return;
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId && m.senderId === userId
              ? { ...m, body: trimmed, editedAt: new Date().toISOString() }
              : m,
          ),
        }));
      },

      deleteMessage: (messageId, userId) => {
        const target = get().messages.find((m) => m.id === messageId && m.senderId === userId);
        if (!target) return null;
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== messageId),
        }));
        return target;
      },

      restoreMessage: (snapshot) =>
        set((s) => {
          if (s.messages.some((m) => m.id === snapshot.id)) return s;
          const next = [...s.messages, snapshot].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          );
          return { messages: next };
        }),

      togglePinMessage: (conversationId, messageId) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId && m.conversationId === conversationId
              ? { ...m, pinned: !m.pinned }
              : m,
          ),
        })),

      votePoll: (messageId, optionId, userId) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== messageId || !m.poll) return m;
            const alreadyInOption = m.poll.options
              .find((o) => o.id === optionId)
              ?.voterIds.includes(userId);
            return {
              ...m,
              poll: {
                ...m.poll,
                options: m.poll.options.map((o) => {
                  const without = o.voterIds.filter((id) => id !== userId);
                  if (o.id !== optionId) return { ...o, voterIds: without };
                  return { ...o, voterIds: alreadyInOption ? without : [...without, userId] };
                }),
              },
            };
          }),
        })),

      setDraft: (conversationId, text) =>
        set((s) => {
          const next = { ...s.drafts };
          if (!text) delete next[conversationId];
          else next[conversationId] = text;
          return { drafts: next };
        }),

      setTyping: (conversationId, typing) =>
        set((s) => ({
          typingByConv: { ...s.typingByConv, [conversationId]: typing },
        })),

      addStory: ({ authorId, authorName, authorAvatar, caption, imageUrl, bgGradient, tag }) => {
        const id = `st_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        const now = new Date();
        const story: ChatStory = {
          id,
          authorId,
          authorName,
          authorAvatar,
          caption: caption.trim(),
          imageUrl,
          bgGradient,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
          reactions: {},
          tag,
        };
        set((s) => ({
          stories: [story, ...s.stories],
        }));
        return id;
      },

      markStorySeen: (storyId) =>
        set((s) => ({
          seenStoryIds: s.seenStoryIds.includes(storyId)
            ? s.seenStoryIds
            : [...s.seenStoryIds, storyId],
        })),

      reactToStory: (storyId, emoji, userId) =>
        set((s) => ({
          stories: s.stories.map((st) => {
            if (st.id !== storyId) return st;
            const prev = { ...st.reactions };
            const cur = prev[emoji] ?? [];
            const next = cur.includes(userId) ? cur.filter((x) => x !== userId) : [...cur, userId];
            if (next.length === 0) delete prev[emoji];
            else prev[emoji] = next;
            return { ...st, reactions: prev };
          }),
        })),

      markRead: (conversationId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          ),
        })),

      muteConversation: (id, muted) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, muted } : c)),
        })),

      archiveConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, status: 'archived' as const } : c,
          ),
          activeWindowIds: s.activeWindowIds.filter((x) => x !== id),
        })),

      reportConversation: (conversationId, reason, messageId) => {
        const report: ChatReport = {
          id: `rep_${Date.now()}`,
          conversationId,
          messageId,
          reason,
          createdAt: new Date().toISOString(),
          status: 'open',
        };
        set((s) => ({
          reports: [...s.reports, report],
          reportedConversationIds: [...new Set([...s.reportedConversationIds, conversationId])],
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, status: 'reported' as const } : c,
          ),
        }));
      },

      dismissEphemeralBanner: (conversationId) =>
        set((s) => ({
          dismissedEphemeralBanners: [...new Set([...s.dismissedEphemeralBanners, conversationId])],
        })),

      undismissEphemeralBanner: (conversationId) =>
        set((s) => ({
          dismissedEphemeralBanners: s.dismissedEphemeralBanners.filter((id) => id !== conversationId),
        })),

      setPrivacy: (patch) => set((s) => ({ privacy: { ...s.privacy, ...patch } })),

      totalUnread: () =>
        get().conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),

      requestKeepChat: (conversationId, userId) => {
        const sysMsg: ChatMessage = {
          id: `m_keep_${Date.now()}`,
          conversationId,
          senderId: 'system',
          senderType: 'system',
          type: 'system',
          body: 'Keep-chat request sent — if others agree, this chat will not expire. / Στάλθηκε αίτημα διατήρησης — αν συμφωνήσουν και οι υπόλοιποι, η συνομιλία δεν θα λήξει.',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, sysMsg],
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, keepRequested: true } : c,
          ),
        }));
        void userId;
      },

      announceArrival: (conversationId, userId) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv) return false;
        const isParty =
          conv.participantUserIds.includes(userId) || conv.organizerUserId === userId;
        if (!isParty) return false;
        if (conv.status !== 'active' && conv.status !== 'persistent') return false;
        const sysMsg: ChatMessage = {
          id: `m_arr_${Date.now()}`,
          conversationId,
          senderId: userId,
          senderType: 'system',
          type: 'arrival_status',
          body: 'I have arrived at the meeting point. / Έφτασα στο σημείο συνάντησης.',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, sysMsg],
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  arrivedAt: sysMsg.createdAt,
                  lastMessageAt: sysMsg.createdAt,
                  lastMessagePreview: {
                    el: 'Έφτασα στο σημείο συνάντησης',
                    en: 'Arrived at the meeting point',
                  },
                }
              : c,
          ),
        }));
        return true;
      },

      ensureEventGroupConversation: ({
        groupId,
        eventId,
        title,
        participantUserIds,
        meetingPoint,
        openWindow = false,
      }) => {
        const existing = get().conversations.find(
          (c) => c.groupId === groupId && c.type === 'event_group',
        );
        if (existing) {
          const nextParticipants = [...new Set(participantUserIds)];
          const participantsChanged =
            nextParticipants.length > 0 &&
            (nextParticipants.length !== existing.participantUserIds.length ||
              nextParticipants.some((id) => !existing.participantUserIds.includes(id)));
          const meetingChanged = Boolean(meetingPoint && existing.meetingPoint !== meetingPoint);
          if (participantsChanged || meetingChanged) {
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === existing.id
                  ? {
                      ...c,
                      participantUserIds: participantsChanged
                        ? nextParticipants
                        : c.participantUserIds,
                      meetingPoint: meetingChanged ? meetingPoint : c.meetingPoint,
                    }
                  : c,
              ),
            }));
          }
          if (openWindow) get().openConversation(existing.id);
          return existing.id;
        }

        const conversationId = `conv_${groupId}`;
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id: conversationId,
          type: 'event_group',
          title,
          eventId,
          groupId,
          participantUserIds: [...new Set(participantUserIds)],
          status: 'active',
          isEphemeral: true,
          canPersist: true,
          unreadCount: 0,
          lastMessageAt: now,
          lastMessagePreview: {
            el: 'Η συνομιλία συντονισμού ξεκίνησε',
            en: 'Coordination chat started',
          },
          meetingPoint,
        };
        const sysMsg: ChatMessage = {
          id: `m_sys_${groupId}`,
          conversationId,
          senderId: 'system',
          senderType: 'system',
          type: 'system',
          body: SYS_COORDINATION_UNLOCKED,
          createdAt: now,
        };

        set((s) => ({
          conversations: [conversation, ...s.conversations],
          messages: [...s.messages, sysMsg],
        }));

        if (openWindow) get().openConversation(conversationId);
        return conversationId;
      },

      ensureDirectConversation: ({
        selfUserId,
        peerUserId,
        peerName,
        openWindow = true,
      }) => {
        const privacy = get().privacy;
        if (!privacy.allowMutualConnectionChats) return null;

        const pair = [selfUserId, peerUserId].sort();
        const conversationId = `conv_dm_${pair.join('_')}`;
        const existing = get().conversations.find(
          (c) =>
            c.id === conversationId ||
            (c.type === 'direct' &&
              c.participantUserIds.length === 2 &&
              pair.every((id) => c.participantUserIds.includes(id))),
        );
        if (existing) {
          if (openWindow) get().openConversation(existing.id);
          return existing.id;
        }

        const now = new Date().toISOString();
        const conversation: Conversation = {
          id: conversationId,
          type: 'direct',
          title: peerName,
          participantUserIds: pair,
          status: 'persistent',
          isEphemeral: false,
          canPersist: true,
          unreadCount: 0,
          lastMessageAt: now,
          lastMessagePreview: {
            el: 'Ξεκίνησε ιδιωτική συνομιλία',
            en: 'Direct chat started',
          },
        };
        const sysMsg: ChatMessage = {
          id: `m_sys_dm_${pair.join('_')}`,
          conversationId,
          senderId: 'system',
          senderType: 'system',
          type: 'system',
          body: SYS_DM_UNLOCKED,
          createdAt: now,
        };

        set((s) => ({
          conversations: [conversation, ...s.conversations],
          messages: [...s.messages, sysMsg],
        }));

        if (openWindow) get().openConversation(conversationId);
        return conversationId;
      },
    }),
    {
      name: 'nakamas-chat-v1',
      partialize: (s) => ({
        privacy: s.privacy,
        dismissedEphemeralBanners: s.dismissedEphemeralBanners,
        conversations: s.conversations,
        messages: s.messages,
        stories: s.stories,
        seenStoryIds: s.seenStoryIds,
        drafts: s.drafts,
        reports: s.reports,
        reportedConversationIds: s.reportedConversationIds,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (!p) return current;
        const mergeById = <T extends { id: string }>(seeds: T[], saved: unknown): T[] => {
          if (!Array.isArray(saved)) return seeds;
          const savedArr = saved as T[];
          const savedIds = new Map(savedArr.map((item) => [item.id, item]));
          const fromSeeds = seeds.map((item) => savedIds.get(item.id) ?? item);
          const seedIds = new Set(seeds.map((item) => item.id));
          return [...fromSeeds, ...savedArr.filter((item) => !seedIds.has(item.id))];
        };
        return {
          ...current,
          ...p,
          conversations: mergeById(current.conversations, p.conversations),
          messages: mergeById(current.messages, p.messages),
          stories: mergeById(current.stories, p.stories),
          seenStoryIds: Array.isArray(p.seenStoryIds)
            ? (p.seenStoryIds as string[])
            : current.seenStoryIds,
          drafts: p.drafts && typeof p.drafts === 'object'
            ? (p.drafts as Record<string, string>)
            : current.drafts,
          reports: Array.isArray(p.reports) ? (p.reports as ChatState['reports']) : current.reports,
          reportedConversationIds: Array.isArray(p.reportedConversationIds)
            ? (p.reportedConversationIds as string[])
            : current.reportedConversationIds,
        } as ChatState;
      },
    },
  ),
);

/* Demo exit («Έξοδος»): demo chats go back to their original state; chat privacy choices stay. */
if (typeof window !== 'undefined') {
  window.addEventListener('nakamas:demo-reset', () => {
    useChatStore.setState({
      conversations: mockConversations,
      messages: mockChatMessages,
      stories: mockChatStories,
      seenStoryIds: [],
      drafts: {},
      typingByConv: {},
      reports: [],
      reportedConversationIds: [],
      openConversationIds: [],
      minimizedIds: [],
      activeWindowIds: [],
      inboxOpen: false,
    });
  });
}
