import { Users } from "lucide-react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Event } from "../types";
import { mockEvents } from "../data/mockEvents";
import { mockGroups } from "../data/mockGroups";
import { mockCalendarPlanEvents, mockCalendarPlanGroups } from "../data/mockCalendarPlan";
import { mockUsers, currentUser } from "../data/mockUsers";
import { mockNotifications } from "../data/mockNotifications";
import { fetchTicketmasterEvents, isTicketmasterConfigured } from "../services/eventApi";
import { canAccessEvent } from "../lib/trust";
import { shouldUnlockGroupDiscount } from "../lib/groupUtils";
import { computeReliabilityDelta } from "../lib/trust";
import { mockCompanyRequests } from "../data/mockCompanyRequests";
import { normalizeCompanyRequest, rateLimitOk } from "../lib/companyRequestUtils";
import type {
  CompanyJoinRequest,
  CompanyRequest,
  CompanyRequestPreferences,
  CompanyRequestReport,
  GroupMergeSuggestion,
} from "../types/companyRequest";
import { DEFAULT_COMPANY_REQUEST_PREFS } from "../types/companyRequest";
import type { BuddySeekIntent, BuddySeekPreferences } from "../types/buddySeek";
import { legacyVisibilityToMode } from "../types/buddySeek";
import type { AppNotification } from "../data/mockNotifications";
import { normalizeAppNotification } from "../lib/notificationsUtil";
import { createEventOnApi, updateEventOnApi } from "../services/eventsApi";

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

export type HomeHeroMode = 'light' | 'balanced' | 'rich';

/** Φ16.8 — persisted user-submitted issue reports (Report Issue page + Admin). */
export interface IssueReport {
  id: string;
  reporterUserId?: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidenceNames: string[];
  createdAt: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
}

/** Φ20 — persisted log of admin moderation actions. */
export interface AdminAction {
  id: string;
  action: string;
  targetId?: string;
  note?: string;
  createdAt: string;
}

/** Φ20.6 — messages sent to organizers from their public profile. */
export interface OrganizerMessage {
  id: string;
  organizerId: string;
  fromUserId?: string;
  message: string;
  createdAt: string;
}

/** Φ20.3 — single source of truth for Settings + Profile privacy controls. */
export interface UserSettings {
  twoFactorEnabled: boolean;
  notificationPrefs: {
    matches: boolean;
    messages: boolean;
    reminders: boolean;
    promos: boolean;
  };
  categoryPrefs: string[];
  privacy: {
    profileVisibility: 'public' | 'connections' | 'private';
    messagePermission: 'everyone' | 'connections' | 'groups';
    shareLocation: boolean;
    revealPhoto: boolean;
    allowMutualPing: boolean;
    allowOrganizerMsg: boolean;
  };
  availability: string[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  twoFactorEnabled: false,
  notificationPrefs: { matches: true, messages: true, reminders: true, promos: false },
  categoryPrefs: [],
  privacy: {
    profileVisibility: 'public',
    messagePermission: 'everyone',
    shareLocation: true,
    revealPhoto: true,
    allowMutualPing: true,
    allowOrganizerMsg: true,
  },
  availability: ['weekends', 'weekday_evenings'],
};

interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  homeHeroMode: HomeHeroMode;
  setHomeHeroMode: (mode: HomeHeroMode) => void;
  events: Event[];
  groups: typeof mockGroups;
  users: typeof mockUsers;
  currentUser: typeof currentUser | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  notifications: typeof mockNotifications;
  eventsLoading: boolean;
  eventsSource: 'mock' | 'api' | 'mixed';
  hydrateEventsFromApi: (events: Event[]) => void;
  setEventsLoading: (loading: boolean) => void;

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
  createEvent: (event: Partial<Event> & { title: string }) => void;
  updateEvent: (eventId: string, patch: Partial<Event>) => void;
  cancelEvent: (eventId: string) => void;
  archiveEvent: (eventId: string) => void;
  publishMeetingPoint: (groupId: string, meetingPoint: string) => void;
  sendGroupAnnouncement: (groupId: string, textEl: string, textEn: string) => void;
  addNotification: (notification: any) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  issueReports: IssueReport[];
  submitIssueReport: (report: Omit<IssueReport, 'id' | 'createdAt' | 'status' | 'reporterUserId'>) => string;
  resolveIssueReport: (id: string, status: IssueReport['status']) => void;
  adminActions: AdminAction[];
  logAdminAction: (action: string, targetId?: string, note?: string) => void;
  organizerMessages: OrganizerMessage[];
  sendOrganizerMessage: (organizerId: string, message: string) => void;

  userSettings: UserSettings;
  updateUserSettings: (patch: Partial<UserSettings>) => void;
  updatePrivacySettings: (patch: Partial<UserSettings['privacy']>) => void;

  bonusXp: number;
  awardXp: (amount: number, reasonEl: string, reasonEn: string) => void;
  challengesJoined: string[];
  toggleChallengeJoined: (challengeId: string) => void;
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
  companyRequests: CompanyRequest[];
  companyJoinRequests: CompanyJoinRequest[];
  groupMergeSuggestions: GroupMergeSuggestion[];
  companyRequestReports: CompanyRequestReport[];
  companyRequestPreferences: CompanyRequestPreferences;
  joinRequestRateLog: { userId: string; at: string }[];
  savedCompanyRequestIds: string[];
  dismissedCompanyRequestIds: string[];
  plansFormingSheetOpen: boolean;
  plansFormingSidebarOpen: boolean;
  setPlansFormingSheetOpen: (open: boolean) => void;
  setPlansFormingSidebarOpen: (open: boolean) => void;
  sendConnectionRequest: (toUserId: string, message?: string) => void;
  acceptConnectionRequest: (requestId: string) => void;
  declineConnectionRequest: (requestId: string) => void;
  removeConnection: (userId: string) => void;

  publishCompanyRequest: (request: Omit<CompanyRequest, 'id' | 'createdAt' | 'updatedAt'>) => string;
  saveCompanyRequestDraft: (request: Omit<CompanyRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  updateCompanyRequest: (requestId: string, patch: Partial<CompanyRequest>) => void;
  pauseCompanyRequest: (requestId: string) => void;
  deleteCompanyRequest: (requestId: string) => void;
  sendCompanyJoinRequest: (companyRequestId: string, message?: string, fromGroupId?: string) => string | null;
  acceptCompanyJoinRequest: (joinRequestId: string) => string | null;
  saveCompanyRequest: (requestId: string) => void;
  unsaveCompanyRequest: (requestId: string) => void;
  declineCompanyJoinRequest: (joinRequestId: string) => void;
  withdrawCompanyJoinRequest: (joinRequestId: string) => void;
  reportCompanyRequest: (
    requestId: string,
    reason: CompanyRequestReport['reason'],
  ) => void;
  suggestGroupMerge: (
    fromGroupId: string,
    toGroupId: string,
    mode: GroupMergeSuggestion['mode'],
    message?: string,
  ) => void;
  respondGroupMerge: (suggestionId: string, accept: boolean) => string | null;
  dismissCompanyRequest: (requestId: string) => void;
  undismissCompanyRequest: (requestId: string) => void;
  declareBuddySeek: (
    eventId: string,
    payload: Omit<BuddySeekIntent, 'id' | 'userId' | 'eventId' | 'status' | 'createdAt' | 'updatedAt'>,
  ) => void;
  updateBuddySeek: (intentId: string, patch: Partial<BuddySeekIntent>) => void;
  cancelBuddySeek: (eventId: string) => void;
  setBuddySeekPreferences: (prefs: Partial<BuddySeekPreferences>) => void;
  setCompanyRequestPreferences: (prefs: Partial<CompanyRequestPreferences>) => void;
  setGroupRecruiting: (groupId: string, recruiting: boolean, note?: string) => void;
  connectWithBuddySeeker: (intentId: string) => void;
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
  homeHeroMode: 'balanced',
  setHomeHeroMode: (homeHeroMode) => set({ homeHeroMode }),
  events: [...mockEvents, ...mockCalendarPlanEvents],
  eventsLoading: false,
  eventsSource: 'mock',
  hydrateEventsFromApi: (events) =>
    set({ events, eventsSource: 'api', eventsLoading: false }),
  setEventsLoading: (eventsLoading) => set({ eventsLoading }),
  groups: [...mockGroups, ...mockCalendarPlanGroups],
  users: mockUsers,
  // Prototype: mock user until backend auth (see src/lib/runtimeMode.ts, docs/ARCHITECTURE.md).
  currentUser: currentUser,
  isAuthenticated: Boolean(currentUser),
  demoMode: false,
  notifications: mockNotifications,
  savedEvents: ['e4', 'e3'],
  waitlistedEvents: [],
  feedbackSubmitted: {},
  onboardingCompleted: false,
  recentSearches: [],
  commitmentHolds: {},
  companyRequests: [...mockCompanyRequests],
  companyJoinRequests: [],
  groupMergeSuggestions: [],
  companyRequestReports: [],
  companyRequestPreferences: { ...DEFAULT_COMPANY_REQUEST_PREFS },
  joinRequestRateLog: [],
  savedCompanyRequestIds: [],
  dismissedCompanyRequestIds: [],
  plansFormingSheetOpen: false,
  plansFormingSidebarOpen: true,
  setPlansFormingSheetOpen: (open) => set({ plansFormingSheetOpen: open }),
  setPlansFormingSidebarOpen: (open) => set({ plansFormingSidebarOpen: open }),

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
      return { currentUser: user, isAuthenticated: true, demoMode: false };
    }),

  logout: () => set({ currentUser: null, isAuthenticated: false, demoMode: false }),

  enterDemoMode: () =>
    set((state) => {
      const user = state.users.find((u) => u.id === 'u1') ?? state.users[0];
      if (!user) return state;
      return {
        demoMode: true,
        currentUser: user,
        isAuthenticated: true,
        onboardingCompleted: true,
      };
    }),

  exitDemoMode: () => set({ demoMode: false, currentUser: null, isAuthenticated: false }),

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

  createEvent: (event) => {
    const state = get();
    if (!state.currentUser) return;
    const newEvent = { ...event, id: event.id ?? `e${Date.now()}` } as Event;
    const newGroup = {
      id: `g${Date.now()}`,
      eventId: newEvent.id,
      hostId: state.currentUser.id,
      targetSize: event.maxParticipants || 5,
      status: "pending" as const,
      members: [state.currentUser.id],
      pendingMembers: [],
      discountUnlocked: false,
      chatId: `chat_${Date.now()}`,
    };
    set({
      events: [...state.events, newEvent],
      groups: [...state.groups, newGroup],
      eventsSource: 'mixed',
    });
    void createEventOnApi(newEvent).catch(() => undefined);
  },

  updateEvent: (eventId, patch) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
      eventsSource: 'mixed',
    }));
    void updateEventOnApi(eventId, patch).catch(() => undefined);
  },

  cancelEvent: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: 'cancelled' as const } : e,
      ),
      groups: state.groups.map((g) =>
        g.eventId === eventId ? { ...g, status: 'cancelled' as const } : g,
      ),
    })),

  archiveEvent: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: 'archived' as const } : e,
      ),
    })),

  publishMeetingPoint: (groupId, meetingPoint) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, meetingPoint } : g,
      ),
    })),

  sendGroupAnnouncement: (groupId, textEl, textEn) =>
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return state;
      return {
        groups: state.groups.map((g) =>
          g.id === groupId
            ? { ...g, lastAnnouncement: { textEl, textEn, at: new Date().toISOString() } }
            : g,
        ),
        notifications: [
          normalizeAppNotification({
            id: `n_ann_${Date.now()}`,
            type: 'message',
            messageEn: `Organizer announcement: ${textEn}`,
            messageGr: `Ανακοίνωση διοργανωτή: ${textEl}`,
            timeEn: 'Just now',
            timeGr: 'Μόλις τώρα',
            color: 'bg-cyan-100 text-cyan-600',
          }),
          ...state.notifications,
        ],
      };
    }),

  // Accepts both the bilingual shape ({messageEn, messageGr, timeEn, timeGr})
  // and the legacy shape ({message, time}); normalizes to bilingual so the
  // Notifications page never renders blank text (Φ16.2).
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        normalizeAppNotification({ ...(notification as Record<string, unknown>) }),
        ...state.notifications,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  issueReports: [],
  submitIssueReport: (report) => {
    const id = `ir_${Date.now()}`;
    set((state) => ({
      issueReports: [
        {
          ...report,
          id,
          reporterUserId: state.currentUser?.id,
          createdAt: new Date().toISOString(),
          status: 'open' as const,
        },
        ...state.issueReports,
      ],
    }));
    return id;
  },

  resolveIssueReport: (id, status) =>
    set((state) => ({
      issueReports: state.issueReports.map((r) => (r.id === id ? { ...r, status } : r)),
    })),

  adminActions: [],
  logAdminAction: (action, targetId, note) =>
    set((state) => ({
      adminActions: [
        { id: `aa_${Date.now()}`, action, targetId, note, createdAt: new Date().toISOString() },
        ...state.adminActions,
      ],
    })),

  organizerMessages: [],
  sendOrganizerMessage: (organizerId, message) =>
    set((state) => ({
      organizerMessages: [
        {
          id: `om_${Date.now()}`,
          organizerId,
          fromUserId: state.currentUser?.id,
          message,
          createdAt: new Date().toISOString(),
        },
        ...state.organizerMessages,
      ],
    })),

  userSettings: { ...DEFAULT_USER_SETTINGS },
  updateUserSettings: (patch) =>
    set((state) => ({
      userSettings: {
        ...state.userSettings,
        ...patch,
        notificationPrefs: { ...state.userSettings.notificationPrefs, ...(patch.notificationPrefs ?? {}) },
        privacy: { ...state.userSettings.privacy, ...(patch.privacy ?? {}) },
      },
    })),

  updatePrivacySettings: (patch) =>
    set((state) => ({
      userSettings: {
        ...state.userSettings,
        privacy: { ...state.userSettings.privacy, ...patch },
      },
    })),

  bonusXp: 0,
  awardXp: (amount, reasonEl, reasonEn) =>
    set((state) => ({
      bonusXp: state.bonusXp + amount,
      notifications: [
        normalizeAppNotification({
          id: `n_xp_${Date.now()}`,
          type: 'achievement',
          messageEn: `+${amount} XP — ${reasonEn}`,
          messageGr: `+${amount} XP — ${reasonEl}`,
          timeEn: 'Just now',
          timeGr: 'Μόλις τώρα',
          color: 'bg-amber-100 text-amber-700',
        }),
        ...state.notifications,
      ],
    })),

  challengesJoined: [],
  toggleChallengeJoined: (challengeId) =>
    set((state) => ({
      challengesJoined: state.challengesJoined.includes(challengeId)
        ? state.challengesJoined.filter((id) => id !== challengeId)
        : [...state.challengesJoined, challengeId],
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
          if (u.id === userId) return { ...u, connections: (u.connections || []).filter((id) => id !== userId) };
          return u;
        }),
        currentUser: { ...state.currentUser, connections: (state.currentUser.connections || []).filter((id) => id !== userId) },
      };
    }),

  publishCompanyRequest: (request) => {
    const id = `cr_${Date.now()}`;
    set((state) => {
      if (!state.currentUser) return state;
      const limit = rateLimitOk(
        state.currentUser.id,
        state.companyRequests,
        state.joinRequestRateLog,
        5,
        10,
      );
      if (!limit.ok) return state;
      const now = new Date().toISOString();
      const full: CompanyRequest = {
        ...request,
        id,
        creatorUserId: state.currentUser.id,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      const existing = state.companyRequests.find(
        (r) =>
          r.creatorUserId === state.currentUser!.id &&
          r.eventId === request.eventId &&
          (r.status === 'active' || r.status === 'draft'),
      );
      if (existing) {
        return {
          companyRequests: state.companyRequests.map((r) =>
            r.id === existing.id ? { ...full, id: existing.id, createdAt: r.createdAt } : r,
          ),
        };
      }
      return { companyRequests: [...state.companyRequests, full] };
    });
    return id;
  },

  saveCompanyRequestDraft: (request) => {
    const id = `cr_draft_${Date.now()}`;
    set((state) => {
      if (!state.currentUser) return state;
      const now = new Date().toISOString();
      const full: CompanyRequest = {
        ...request,
        id,
        creatorUserId: state.currentUser.id,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      return { companyRequests: [...state.companyRequests, full] };
    });
    return id;
  },

  updateCompanyRequest: (requestId, patch) =>
    set((state) => ({
      companyRequests: state.companyRequests.map((r) =>
        r.id === requestId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
      ),
    })),

  pauseCompanyRequest: (requestId) =>
    set((state) => ({
      companyRequests: state.companyRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'paused' as const, updatedAt: new Date().toISOString() } : r,
      ),
    })),

  deleteCompanyRequest: (requestId) =>
    set((state) => ({
      companyRequests: state.companyRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'deleted' as const, updatedAt: new Date().toISOString() } : r,
      ),
    })),

  sendCompanyJoinRequest: (companyRequestId, message, fromGroupId) => {
    let joinId: string | null = null;
    set((state) => {
      if (!state.currentUser) return state;
      const request = state.companyRequests.find((r) => r.id === companyRequestId);
      if (!request || request.creatorUserId === state.currentUser.id) return state;
      const limit = rateLimitOk(
        state.currentUser.id,
        state.companyRequests,
        state.joinRequestRateLog,
        5,
        8,
      );
      if (!limit.ok) return state;
      const dup = state.companyJoinRequests.some(
        (j) =>
          j.companyRequestId === companyRequestId &&
          j.fromUserId === state.currentUser!.id &&
          j.status === 'pending',
      );
      if (dup) return state;
      joinId = `cjr_${Date.now()}`;
      const join: CompanyJoinRequest = {
        id: joinId,
        companyRequestId,
        fromUserId: state.currentUser.id,
        fromGroupId,
        targetUserId: request.creatorUserId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        chatUnlocked: false,
      };
      const event = state.events.find((e) => e.id === request.eventId);
      return {
        companyJoinRequests: [...state.companyJoinRequests, join],
        joinRequestRateLog: [
          ...state.joinRequestRateLog,
          { userId: state.currentUser.id, at: new Date().toISOString() },
        ],
        notifications: [
          normalizeAppNotification({
            id: `n_cjr_${Date.now()}`,
            type: 'buddy_seek',
            messageEn: event
              ? `Someone asked to join your plan for "${event.title}"`
              : 'New join request on your company request',
            messageGr: event
              ? `Κάποιος ζήτησε να μπει στο σχέδιό σου για «${event.title}»`
              : 'Νέο αίτημα σύνδεσης στο αίτημά σας',
            timeEn: 'Just now',
            timeGr: 'Μόλις τώρα',
            icon: Users,
            color: 'bg-cyan-100 text-cyan-700',
          }),
          ...state.notifications,
        ],
      };
    });
    return joinId;
  },

  acceptCompanyJoinRequest: (joinRequestId) => {
    let coordinationGroupId: string | null = null;
    set((state) => {
      const join = state.companyJoinRequests.find((j) => j.id === joinRequestId);
      if (!join || !state.currentUser || join.targetUserId !== state.currentUser.id) return state;
      const companyRequest = state.companyRequests.find((r) => r.id === join.companyRequestId);
      if (!companyRequest) return state;
      const event = state.events.find((e) => e.id === companyRequest.eventId);
      const requester = state.users.find((u) => u.id === join.fromUserId);
      const targetSize = companyRequest.preferredGroupMax ?? event?.groupDiscount?.minSize ?? 5;
      coordinationGroupId = `g_plan_${Date.now()}`;
      const memberIds = [...new Set([join.fromUserId, join.targetUserId!])];
      const newGroup = {
        id: coordinationGroupId,
        eventId: companyRequest.eventId,
        hostId: state.currentUser.id,
        targetSize,
        status: 'pending' as const,
        members: memberIds,
        pendingMembers: [],
        discountUnlocked: false,
        isRecruiting: false,
        recruitingNote: 'Plan coordination chat',
      };
      return {
        groups: [...state.groups, newGroup],
        companyJoinRequests: state.companyJoinRequests.map((j) =>
          j.id === joinRequestId
            ? {
                ...j,
                status: 'accepted' as const,
                chatUnlocked: true,
                coordinationGroupId: coordinationGroupId!,
              }
            : j,
        ),
        companyRequests: state.companyRequests.map((r) =>
          r.id === companyRequest.id
            ? { ...r, status: 'matched' as const, matchedGroupId: coordinationGroupId!, updatedAt: new Date().toISOString() }
            : r,
        ),
        notifications: [
          normalizeAppNotification({
            id: `n_cjr_ok_${Date.now()}`,
            type: 'buddy_seek',
            messageEn: requester
              ? `Accepted — group chat ready with ${requester.name.split(' ')[0]}`
              : 'Join request accepted — group chat ready',
            messageGr: requester
              ? `Αποδεχτήκατε — έτοιμο group chat με ${requester.name.split(' ')[0]}`
              : 'Το αίτημα έγινε δεκτό — έτοιμο group chat',
            timeEn: 'Just now',
            timeGr: 'Μόλις τώρα',
            icon: Users,
            color: 'bg-emerald-100 text-emerald-700',
          }),
          ...state.notifications,
        ],
      };
    });
    return coordinationGroupId;
  },

  declineCompanyJoinRequest: (joinRequestId) =>
    set((state) => ({
      companyJoinRequests: state.companyJoinRequests.map((j) =>
        j.id === joinRequestId ? { ...j, status: 'declined' as const } : j,
      ),
    })),

  withdrawCompanyJoinRequest: (joinRequestId) =>
    set((state) => ({
      companyJoinRequests: state.companyJoinRequests.map((j) =>
        j.id === joinRequestId ? { ...j, status: 'withdrawn' as const } : j,
      ),
    })),

  reportCompanyRequest: (requestId, reason) =>
    set((state) => {
      if (!state.currentUser) return state;
      const report: CompanyRequestReport = {
        id: `crr_${Date.now()}`,
        requestId,
        reporterUserId: state.currentUser.id,
        reason,
        createdAt: new Date().toISOString(),
      };
      return {
        companyRequestReports: [...state.companyRequestReports, report],
        companyRequests: state.companyRequests.map((r) =>
          r.id === requestId
            ? { ...r, reportCountInternal: (r.reportCountInternal ?? 0) + 1 }
            : r,
        ),
      };
    }),

  suggestGroupMerge: (fromGroupId, toGroupId, mode, message) =>
    set((state) => {
      if (!state.currentUser) return state;
      const from = state.groups.find((g) => g.id === fromGroupId);
      if (!from) return state;
      const suggestion: GroupMergeSuggestion = {
        id: `gm_${Date.now()}`,
        eventId: from.eventId,
        fromGroupId,
        toGroupId,
        fromUserId: state.currentUser.id,
        message,
        mode,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      return { groupMergeSuggestions: [...state.groupMergeSuggestions, suggestion] };
    }),

  respondGroupMerge: (suggestionId, accept) => {
    let resultGroupId: string | null = null;
    set((state) => {
      const suggestion = state.groupMergeSuggestions.find((s) => s.id === suggestionId);
      if (!suggestion || !state.currentUser) return state;
      if (!accept) {
        return {
          groupMergeSuggestions: state.groupMergeSuggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: 'declined' as const } : s,
          ),
        };
      }
      const from = state.groups.find((g) => g.id === suggestion.fromGroupId);
      const to = state.groups.find((g) => g.id === suggestion.toGroupId);
      if (!from || !to) return state;

      if (suggestion.mode === 'merge') {
        const mergedMembers = [...new Set([...from.members, ...to.members])];
        const mergedId = `g_merged_${Date.now()}`;
        const mergedGroup = {
          id: mergedId,
          eventId: from.eventId,
          hostId: from.hostId ?? state.currentUser.id,
          targetSize: Math.max(from.targetSize, to.targetSize, mergedMembers.length + 2),
          status: 'pending' as const,
          members: mergedMembers,
          pendingMembers: [],
          discountUnlocked: from.discountUnlocked || to.discountUnlocked,
          isRecruiting: false,
        };
        resultGroupId = mergedId;
        return {
          groups: [
            ...state.groups.filter((g) => g.id !== from.id && g.id !== to.id),
            mergedGroup,
          ],
          groupMergeSuggestions: state.groupMergeSuggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: 'accepted' as const } : s,
          ),
        };
      }

      resultGroupId = from.id;
      if (suggestion.mode === 'share_chat' || suggestion.mode === 'meet_before') {
        const coordId = `g_coord_${Date.now()}`;
        const organizers = [...new Set([from.hostId, to.hostId].filter(Boolean))] as string[];
        resultGroupId = coordId;
        return {
          groups: [
            ...state.groups,
            {
              id: coordId,
              eventId: from.eventId,
              hostId: state.currentUser.id,
              targetSize: from.targetSize + to.targetSize,
              status: 'pending' as const,
              members: organizers.length ? organizers : [state.currentUser.id],
              pendingMembers: [],
              discountUnlocked: false,
              isRecruiting: false,
              recruitingNote:
                suggestion.mode === 'meet_before' ? 'Meet before event' : 'Temporary coordination',
            },
          ],
          groupMergeSuggestions: state.groupMergeSuggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: 'accepted' as const } : s,
          ),
        };
      }

      return {
        groupMergeSuggestions: state.groupMergeSuggestions.map((s) =>
          s.id === suggestionId ? { ...s, status: 'accepted' as const } : s,
        ),
      };
    });
    return resultGroupId;
  },

  saveCompanyRequest: (requestId) =>
    set((state) => ({
      savedCompanyRequestIds: state.savedCompanyRequestIds.includes(requestId)
        ? state.savedCompanyRequestIds
        : [...state.savedCompanyRequestIds, requestId],
    })),

  unsaveCompanyRequest: (requestId) =>
    set((state) => ({
      savedCompanyRequestIds: state.savedCompanyRequestIds.filter((id) => id !== requestId),
    })),

  dismissCompanyRequest: (requestId) =>
    set((state) => ({
      dismissedCompanyRequestIds: state.dismissedCompanyRequestIds.includes(requestId)
        ? state.dismissedCompanyRequestIds
        : [...state.dismissedCompanyRequestIds, requestId],
    })),

  undismissCompanyRequest: (requestId) =>
    set((state) => ({
      dismissedCompanyRequestIds: state.dismissedCompanyRequestIds.filter((id) => id !== requestId),
    })),

  declareBuddySeek: (eventId, payload) => {
    get().publishCompanyRequest({
      eventId,
      creatorUserId: get().currentUser?.id ?? '',
      lookingForType:
        payload.matchPreference === 'individuals'
          ? 'find_people'
          : payload.matchPreference === 'groups'
            ? 'join_group'
            : 'open_to_suggestions',
      message: payload.message,
      openToJoinGroup: payload.openToJoinGroup,
      visibilityMode: legacyVisibilityToMode(payload.visibility),
      profileExposure: 'interests_only',
      meetingPreference: 'chat_first',
      requiredTrustTier: 'none',
      status: 'active',
    });
  },

  updateBuddySeek: (intentId, patch) => {
    const legacyPatch: Partial<CompanyRequest> = {};
    if (patch.status) {
      legacyPatch.status =
        patch.status === 'fulfilled'
          ? 'matched'
          : patch.status === 'cancelled'
            ? 'cancelled'
            : patch.status;
    }
    if (patch.message) legacyPatch.message = patch.message;
    get().updateCompanyRequest(intentId, legacyPatch);
  },

  cancelBuddySeek: (eventId) => {
    const state = get();
    if (!state.currentUser) return;
    const mine = state.companyRequests.find(
      (r) =>
        r.creatorUserId === state.currentUser!.id &&
        r.eventId === eventId &&
        r.status === 'active',
    );
    if (mine) get().deleteCompanyRequest(mine.id);
  },

  setBuddySeekPreferences: (prefs) => get().setCompanyRequestPreferences(prefs as Partial<CompanyRequestPreferences>),

  setCompanyRequestPreferences: (prefs) =>
    set((state) => ({
      companyRequestPreferences: { ...state.companyRequestPreferences, ...prefs },
    })),

  setGroupRecruiting: (groupId, recruiting, note) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, isRecruiting: recruiting, recruitingNote: note ?? g.recruitingNote }
          : g,
      ),
    })),

  connectWithBuddySeeker: (intentId) => {
    get().sendCompanyJoinRequest(intentId, undefined);
  },

  /** Merges Ticketmaster events (ids prefixed tm_) when VITE_TICKETMASTER_API_KEY is set. */
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
        homeHeroMode: state.homeHeroMode,
        waitlistedEvents: state.waitlistedEvents,
        feedbackSubmitted: state.feedbackSubmitted,
        onboardingCompleted: state.onboardingCompleted,
        recentSearches: state.recentSearches,
        commitmentHolds: state.commitmentHolds,
        companyRequests: state.companyRequests,
        companyRequestPreferences: state.companyRequestPreferences,
        companyJoinRequests: state.companyJoinRequests,
        savedCompanyRequestIds: state.savedCompanyRequestIds,
        dismissedCompanyRequestIds: state.dismissedCompanyRequestIds,
        plansFormingSidebarOpen: state.plansFormingSidebarOpen,
        // Φ16.1 — survive refresh: created events, group membership, profile
        // edits, notifications, connection requests, merges, reports, settings.
        events: state.events,
        groups: state.groups,
        users: state.users,
        currentUserId: state.currentUser?.id ?? null,
        // Icons are components (not serializable); the UI derives icons from `type`.
        notifications: state.notifications.map(({ icon: _icon, ...n }) => n),
        connectionRequests: state.connectionRequests,
        groupMergeSuggestions: state.groupMergeSuggestions,
        companyRequestReports: state.companyRequestReports,
        issueReports: state.issueReports,
        adminActions: state.adminActions,
        organizerMessages: state.organizerMessages,
        userSettings: state.userSettings,
        bonusXp: state.bonusXp,
        challengesJoined: state.challengesJoined,
        demoMode: state.demoMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (!p) return current;
        let companyRequests = current.companyRequests;
        if (Array.isArray(p.companyRequests)) {
          companyRequests = (p.companyRequests as Record<string, unknown>[]).map(normalizeCompanyRequest);
        } else if (Array.isArray(p.buddySeekIntents)) {
          companyRequests = (p.buddySeekIntents as Record<string, unknown>[]).map(normalizeCompanyRequest);
        }
        const companyRequestPreferences = {
          ...DEFAULT_COMPANY_REQUEST_PREFS,
          ...(p.companyRequestPreferences as object),
          ...(p.buddySeekPreferences as object),
        };

        // Φ16.1 — rehydrate entity lists by merging persisted entries over the
        // fresh mock seeds: persisted wins per id, mock-only ids are kept so
        // future mock-data additions are never lost.
        const mergeById = <T extends { id: string }>(seeds: T[], saved: unknown): T[] => {
          if (!Array.isArray(saved)) return seeds;
          const savedArr = saved as T[];
          const savedIds = new Map(savedArr.map((item) => [item.id, item]));
          const fromSeeds = seeds.map((item) => savedIds.get(item.id) ?? item);
          const seedIds = new Set(seeds.map((item) => item.id));
          const extras = savedArr.filter((item) => !seedIds.has(item.id));
          return [...fromSeeds, ...extras];
        };

        const events = mergeById(current.events, p.events);
        const groups = mergeById(current.groups, p.groups);
        const users = mergeById(current.users, p.users);
        const notifications = Array.isArray(p.notifications)
          ? (p.notifications as typeof current.notifications)
          : current.notifications;
        const connectionRequests = Array.isArray(p.connectionRequests)
          ? (p.connectionRequests as typeof current.connectionRequests)
          : current.connectionRequests;
        // Rehydrate the logged-in user from the merged users list (keeps edits).
        const persistedCurrentUserId = p.currentUserId as string | null | undefined;
        const currentUserResolved =
          persistedCurrentUserId === undefined
            ? current.currentUser
            : persistedCurrentUserId === null
              ? null
              : users.find((u) => u.id === persistedCurrentUserId) ?? current.currentUser;

        const userSettings = {
          ...DEFAULT_USER_SETTINGS,
          ...(p.userSettings as object),
          notificationPrefs: {
            ...DEFAULT_USER_SETTINGS.notificationPrefs,
            ...((p.userSettings as UserSettings | undefined)?.notificationPrefs ?? {}),
          },
          privacy: {
            ...DEFAULT_USER_SETTINGS.privacy,
            ...((p.userSettings as UserSettings | undefined)?.privacy ?? {}),
          },
        };

        return {
          ...current,
          ...p,
          companyRequests,
          companyRequestPreferences,
          events,
          groups,
          users,
          notifications,
          connectionRequests,
          currentUser: currentUserResolved,
          isAuthenticated: Boolean(currentUserResolved),
          demoMode: Boolean(p.demoMode),
          userSettings,
        };
      },
    },
  ),
);
