import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, ChatMessage, ChatPrivacySettings } from '../types/chat';
import { DEFAULT_CHAT_PRIVACY } from '../types/chat';
import { mockConversations, mockChatMessages } from '../data/mockChatData';
import { emitChatMessage, joinChatRoom } from '../lib/realtime/socket';
import { isFirebaseChatEnabled, sendFirebaseMessage } from '../lib/realtime/firebaseChat';

export interface ChatReport {
  id: string;
  conversationId: string;
  messageId?: string;
  reason: string;
  createdAt: string;
  status: 'open' | 'closed';
}

interface ChatState {
  conversations: Conversation[];
  messages: ChatMessage[];
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
  /** Φ17 — inbound message (simulated/peer): appends + bumps unreadCount. */
  receiveMessage: (conversationId: string, body: string, senderId: string, type?: ChatMessage['type']) => void;
  markRead: (conversationId: string) => void;
  muteConversation: (id: string, muted: boolean) => void;
  archiveConversation: (id: string) => void;
  reportConversation: (conversationId: string, reason: string, messageId?: string) => void;
  dismissEphemeralBanner: (conversationId: string) => void;
  setPrivacy: (patch: Partial<ChatPrivacySettings>) => void;
  totalUnread: () => number;
  /** Φ17 — real keep-chat request: flags the conversation + system message. */
  requestKeepChat: (conversationId: string, userId: string) => void;
  /** Φ17 — "I arrived" at the meeting point: arrival system message. */
  announceArrival: (conversationId: string, userId: string) => void;
}

const MAX_WINDOWS = 2;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: mockConversations,
      messages: mockChatMessages,
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
        const msg: ChatMessage = {
          id: `m_${Date.now()}`,
          conversationId,
          senderId,
          senderType: 'user',
          type: 'text',
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
                }
              : c,
          ),
        }));
        if (isFirebaseChatEnabled()) {
          void sendFirebaseMessage(conversationId, senderId, body);
        } else {
          joinChatRoom(conversationId);
          emitChatMessage(conversationId, senderId, body);
        }
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
                  // Don't bump unread when the window is already open.
                  unreadCount: get().activeWindowIds.includes(conversationId)
                    ? c.unreadCount
                    : c.unreadCount + 1,
                }
              : c,
          ),
        }));
      },

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
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, status: 'archived' as const } : c)),
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

      setPrivacy: (patch) => set((s) => ({ privacy: { ...s.privacy, ...patch } })),

      totalUnread: () => get().conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),

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
      },
    }),
    {
      name: 'nakamas-chat-v1',
      // Φ17 — persist conversations, messages and reports so chats survive
      // refresh; merge keeps fresh mock seeds for ids the user never touched.
      partialize: (s) => ({
        privacy: s.privacy,
        dismissedEphemeralBanners: s.dismissedEphemeralBanners,
        conversations: s.conversations,
        messages: s.messages,
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
          reports: Array.isArray(p.reports) ? (p.reports as ChatState['reports']) : current.reports,
          reportedConversationIds: Array.isArray(p.reportedConversationIds)
            ? (p.reportedConversationIds as string[])
            : current.reportedConversationIds,
        } as ChatState;
      },
    },
  ),
);
