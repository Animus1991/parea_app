import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Event } from "../types";
import { mockEvents } from "../data/mockEvents";
import { mockGroups } from "../data/mockGroups";
import { mockUsers, currentUser } from "../data/mockUsers";
import { mockNotifications } from "../data/mockNotifications";
import { fetchTicketmasterEvents, isTicketmasterConfigured } from "../services/eventApi";
import { canAccessEvent } from "../lib/trust";
import { shouldUnlockGroupDiscount } from "../lib/groupUtils";
import { computeReliabilityDelta } from "../lib/trust";

export interface FeedbackData {
  eventId: string;
  overallRating: number;
  vibeRating: number;
  mood: string;
  comment: string;
  submittedAt: string;
  attendance?: string;
  safetyComfort?: string;
}

export interface CommitmentHold {
  eventId: string;
  heldAt: string;
  amount: number;
}

interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  events: Event[];
  groups: typeof mockGroups;
  users: typeof mockUsers;
  currentUser: typeof currentUser | null;
  isAuthenticated: boolean;
  notifications: typeof mockNotifications;
  eventsLoading: boolean;
  eventsSource: 'mock' | 'api' | 'mixed';

  onboardingCompleted: boolean;
  recentSearches: string[];
  commitmentHolds: Record<string, CommitmentHold>;

  login: (userId: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  addRecentSearch: (query: string) => void;
  getPendingFeedbackEventId: () => string | null;
  canJoinEvent: (eventId: string) => { ok: boolean; messageEl: string; messageEn: string };
  placeCommitmentHold: (eventId: string) => void;
  hasCommitmentHold: (eventId: string) => boolean;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  createGroup: (eventId: string, targetSize: number) => void;
  becomeEventHost: (eventId: string) => void;
  createEvent: (event: any) => void;
  addNotification: (notification: any) => void;
  markNotificationRead: (id: string) => void;
  updateUser: (userId: string, data: Partial<typeof currentUser>) => void;
  toggleLiveTracking: (groupId: string, enabled: boolean) => void;
  updateMemberLocation: (
    groupId: string,
    userId: string,
    location: { lat: number; lng: number; sos?: boolean },
  ) => void;
  triggerSos: (groupId: string, userId: string, active: boolean) => void;
  savedEvents: string[];
  toggleSavedEvent: (eventId: string) => void;
  fetchExternalEvents: () => Promise<void>;

  waitlistedEvents: string[];
  addToWaitlist: (eventId: string) => void;
  removeFromWaitlist: (eventId: string) => void;

  feedbackSubmitted: Record<string, FeedbackData>;
  submitFeedback: (data: FeedbackData) => void;

  connectionRequests: { id: string; fromUserId: string; toUserId: string; message?: string; createdAt: string; status: 'pending' | 'accepted' | 'declined' }[];
  sendConnectionRequest: (toUserId: string, message?: string) => void;
  acceptConnectionRequest: (requestId: string) => void;
  declineConnectionRequest: (requestId: string) => void;
  removeConnection: (userId: string) => void;
}

function applyGroupDiscount(
  groups: typeof mockGroups,
  events: Event[],
  groupId: string,
): typeof mockGroups {
  return groups.map((g) => {
    if (g.id !== groupId) return g;
    const event = events.find((e) => e.id === g.eventId);
    if (!event || !shouldUnlockGroupDiscount(g, event)) return g;
    return { ...g, discountUnlocked: true, status: g.members.length >= g.targetSize ? 'confirmed' as const : g.status };
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  theme: 'classic',
  setTheme: (theme) => set({ theme }),
  events: mockEvents,
  eventsLoading: false,
  eventsSource: 'mock',
  groups: mockGroups,
  users: mockUsers,
  currentUser: currentUser,
  isAuthenticated: true,
  notifications: mockNotifications,
  savedEvents: [],
  waitlistedEvents: [],
  feedbackSubmitted: {},
  onboardingCompleted: false,
  recentSearches: [],
  commitmentHolds: {},

  completeOnboarding: () => set({ onboardingCompleted: true }),

  addRecentSearch: (query) =>
    set((state) => {
      const q = query.trim();
      if (!q) return state;
      const next = [q, ...state.recentSearches.filter((s) => s !== q)].slice(0, 8);
      return { recentSearches: next };
    }),

  getPendingFeedbackEventId: () => {
    const state = get();
    if (!state.currentUser) return null;
    const userGroupEventIds = state.groups
      .filter((g) => g.members.includes(state.currentUser!.id))
      .map((g) => g.eventId);
    const pending = state.events.find((e) => {
      if (!userGroupEventIds.includes(e.id)) return false;
      if (state.feedbackSubmitted[e.id]) return false;
      try {
        return new Date(`${e.date}T${e.time || '20:00'}`) < new Date();
      } catch {
        return false;
      }
    });
    return pending?.id ?? null;
  },

  canJoinEvent: (eventId) => {
    const state = get();
    const event = state.events.find((e) => e.id === eventId);
    if (!event || !state.currentUser) {
      return { ok: false, messageEl: 'Η εκδήλωση δεν βρέθηκε.', messageEn: 'Event not found.' };
    }
    const pendingId = get().getPendingFeedbackEventId();
    if (pendingId && pendingId !== eventId) {
      return {
        ok: false,
        messageEl: 'Ολοκληρώστε πρώτα την αξιολόγηση της προηγούμενης εκδήλωσης.',
        messageEn: 'Please complete feedback for your previous event first.',
      };
    }
    const tier = canAccessEvent(state.currentUser, event);
    if (!tier.allowed) {
      return { ok: false, messageEl: tier.messageEl, messageEn: tier.messageEn };
    }
    return { ok: true, messageEl: '', messageEn: '' };
  },

  placeCommitmentHold: (eventId) =>
    set((state) => {
      const event = state.events.find((e) => e.id === eventId);
      if (!state.currentUser || !event) return state;
      return {
        commitmentHolds: {
          ...state.commitmentHolds,
          [eventId]: {
            eventId,
            heldAt: new Date().toISOString(),
            amount: event.isPaid ? event.price : 0,
          },
        },
      };
    }),

  hasCommitmentHold: (eventId) => Boolean(get().commitmentHolds[eventId]),

  login: (userId) =>
    set((state) => {
      const user = state.users.find((u) => u.id === userId);
      if (!user) return state;
      return { currentUser: user, isAuthenticated: true };
    }),

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  joinGroup: (groupId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const userId = state.currentUser.id;
      let groups = state.groups.map((g) =>
        g.id === groupId && !g.members.includes(userId)
          ? { ...g, members: [...g.members, userId] }
          : g,
      );
      groups = applyGroupDiscount(groups, state.events, groupId);
      return { groups };
    }),

  leaveGroup: (groupId) =>
    set((state) => {
      if (!state.currentUser) return state;
      return {
        groups: state.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.filter(
                  (mId) => state.currentUser && mId !== state.currentUser.id,
                ),
              }
            : g,
        ),
      };
    }),

  createGroup: (eventId, targetSize) =>
    set((state) => {
      if (!state.currentUser) return state;
      const newGroup = {
        id: `g${Date.now()}`,
        eventId,
        hostId: state.currentUser.id,
        targetSize,
        status: "pending" as const,
        members: [state.currentUser.id],
        pendingMembers: [],
        discountUnlocked: false,
        chatId: `chat_${Date.now()}`,
      };
      return {
        groups: [...state.groups, newGroup],
      };
    }),

  becomeEventHost: (eventId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const uid = state.currentUser.id;
      // If a hosted group already exists for this event, do nothing.
      if (state.groups.some((g) => g.eventId === eventId && g.hostId)) return state;
      const event = state.events.find((e) => e.id === eventId);
      const targetSize = event?.groupDiscount?.minSize || 4;
      // Claim an existing host-less (system-created) group, else create one.
      const hostless = state.groups.find((g) => g.eventId === eventId && !g.hostId);
      const groups = hostless
        ? state.groups.map((g) =>
            g.id === hostless.id
              ? {
                  ...g,
                  hostId: uid,
                  members: g.members.includes(uid) ? g.members : [...g.members, uid],
                }
              : g,
          )
        : [
            ...state.groups,
            {
              id: `g${Date.now()}`,
              eventId,
              hostId: uid,
              targetSize,
              status: "pending" as const,
              members: [uid],
              pendingMembers: [],
              discountUnlocked: false,
              chatId: `chat_${Date.now()}`,
            },
          ];
      return {
        groups,
        currentUser: { ...state.currentUser, isOrganizer: true },
        users: state.users.map((u) => (u.id === uid ? { ...u, isOrganizer: true } : u)),
      };
    }),

  createEvent: (event) =>
    set((state) => {
      if (!state.currentUser) return state;
      const newEvent = { ...event, id: `e${Date.now()}` };
      const newGroup = {
        id: `g${Date.now()}`,
        eventId: newEvent.id,
        hostId: state.currentUser.id,
        targetSize: event.maxAttendees || 5,
        status: "pending" as const,
        members: [state.currentUser.id],
        pendingMembers: [],
        discountUnlocked: false,
        chatId: `chat_${Date.now()}`,
      };
      return {
        events: [...state.events, newEvent],
        groups: [...state.groups, newGroup],
      };
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: Date.now().toString(), read: false },
        ...state.notifications,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  updateUser: (userId, data) =>
    set((state) => {
      const isCurrentUser = state.currentUser?.id === userId;
      return {
        users: state.users.map((u) =>
          u.id === userId ? { ...u, ...data } : u,
        ),
        currentUser:
          isCurrentUser && state.currentUser
            ? { ...state.currentUser, ...data }
            : state.currentUser,
      };
    }),

  toggleLiveTracking: (groupId, enabled) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, isLiveTrackingActive: enabled } : g,
      ),
    })),

  updateMemberLocation: (groupId, userId, location) =>
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const membersLocations = { ...g.membersLocations };
        membersLocations[userId] = { ...location, timestamp: Date.now() };
        return { ...g, membersLocations };
      }),
    })),

  triggerSos: (groupId, userId, active) =>
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const membersLocations = { ...g.membersLocations };
        if (membersLocations[userId]) {
          membersLocations[userId] = {
            ...membersLocations[userId],
            sos: active,
            timestamp: Date.now(),
          };
        }
        return { ...g, membersLocations };
      }),
    })),

  toggleSavedEvent: (eventId) =>
    set((state) => {
      const isSaved = state.savedEvents.includes(eventId);
      return {
        savedEvents: isSaved
          ? state.savedEvents.filter((id) => id !== eventId)
          : [...state.savedEvents, eventId],
      };
    }),

  addToWaitlist: (eventId) =>
    set((state) => {
      if (state.waitlistedEvents.includes(eventId)) return state;
      return { waitlistedEvents: [...state.waitlistedEvents, eventId] };
    }),

  removeFromWaitlist: (eventId) =>
    set((state) => ({
      waitlistedEvents: state.waitlistedEvents.filter((id) => id !== eventId),
    })),

  submitFeedback: (data) =>
    set((state) => {
      const delta = computeReliabilityDelta(data);
      const userId = state.currentUser?.id;
      let users = state.users;
      let currentUser = state.currentUser;
      if (userId && state.currentUser) {
        const newScore = Math.min(100, Math.max(0, state.currentUser.reliabilityScore + delta));
        users = state.users.map((u) =>
          u.id === userId ? { ...u, reliabilityScore: newScore } : u,
        );
        currentUser = { ...state.currentUser, reliabilityScore: newScore };
      }
      return {
        feedbackSubmitted: {
          ...state.feedbackSubmitted,
          [data.eventId]: data,
        },
        users,
        currentUser,
      };
    }),

  connectionRequests: [
    { id: 'cr1', fromUserId: 'org2', toUserId: 'u1', message: 'We noticed you attended our events. Let\'s connect!', createdAt: '2024-01-15', status: 'pending' as const },
    { id: 'cr2', fromUserId: 'org4', toUserId: 'u1', createdAt: '2024-01-14', status: 'pending' as const },
  ],

  sendConnectionRequest: (toUserId, message) =>
    set((state) => {
      if (!state.currentUser) return state;
      const exists = state.connectionRequests.some(
        (r) => r.fromUserId === state.currentUser!.id && r.toUserId === toUserId && r.status === 'pending'
      );
      if (exists) return state;
      return {
        connectionRequests: [
          ...state.connectionRequests,
          { id: `cr${Date.now()}`, fromUserId: state.currentUser.id, toUserId, message, createdAt: new Date().toISOString().split('T')[0], status: 'pending' as const },
        ],
      };
    }),

  acceptConnectionRequest: (requestId) =>
    set((state) => {
      const req = state.connectionRequests.find((r) => r.id === requestId);
      if (!req || !state.currentUser) return state;
      return {
        connectionRequests: state.connectionRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'accepted' as const } : r
        ),
        users: state.users.map((u) => {
          if (u.id === req.fromUserId) return { ...u, connections: [...(u.connections || []), req.toUserId] };
          if (u.id === req.toUserId) return { ...u, connections: [...(u.connections || []), req.fromUserId] };
          return u;
        }),
        currentUser:
          state.currentUser.id === req.toUserId
            ? { ...state.currentUser, connections: [...(state.currentUser.connections || []), req.fromUserId] }
            : state.currentUser,
      };
    }),

  declineConnectionRequest: (requestId) =>
    set((state) => ({
      connectionRequests: state.connectionRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      ),
    })),

  removeConnection: (userId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const myId = state.currentUser.id;
      return {
        users: state.users.map((u) => {
          if (u.id === myId) return { ...u, connections: (u.connections || []).filter((id) => id !== userId) };
          if (u.id === userId) return { ...u, connections: (u.connections || []).filter((id) => id !== myId) };
          return u;
        }),
        currentUser: { ...state.currentUser, connections: (state.currentUser.connections || []).filter((id) => id !== userId) },
      };
    }),

  fetchExternalEvents: async () => {
    if (!isTicketmasterConfigured()) return;
    set({ eventsLoading: true });
    try {
      const tmEvents = await fetchTicketmasterEvents();
      if (tmEvents.length > 0) {
        const existing = get().events;
        const existingIds = new Set(existing.map((e) => e.id));
        const newEvents = tmEvents.filter((e) => !existingIds.has(e.id));
        set({
          events: [...existing, ...newEvents],
          eventsSource: 'mixed',
          eventsLoading: false,
        });
      } else {
        set({ eventsLoading: false });
      }
    } catch {
      set({ eventsLoading: false });
    }
  },
}),
    {
      name: 'nakamas-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedEvents: state.savedEvents,
        theme: state.theme,
        waitlistedEvents: state.waitlistedEvents,
        feedbackSubmitted: state.feedbackSubmitted,
        onboardingCompleted: state.onboardingCompleted,
        recentSearches: state.recentSearches,
        commitmentHolds: state.commitmentHolds,
      }),
    },
  ),
);
