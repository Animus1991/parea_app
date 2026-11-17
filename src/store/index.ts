import { Users } from "lucide-react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Event } from "../types";
import type { User } from "../types";
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
import { useChatStore } from "./chatStore";
import { normalizeCompanyRequest, rateLimitOk } from "../lib/companyRequestUtils";
import {
  DEFAULT_ACCOUNT_PRIVACY,
  canViewerContactOrganizer,
  type AccountPrivacy,
} from "../lib/profilePrivacy";
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
import { audienceToProfileVisibility } from "../lib/audience";
import { mockOutingEvents, mockOutingGroups, withOutingPatches, withOutingPeople } from "../data/mockOutings";
import {
  createOutingsSlice,
  eventStartMs,
  handOverSeat,
  LATE_CANCEL_MS,
  outingsSeedData,
  patchPerson,
  withGroupCode,
  type OutingsSlice,
} from "./outingsSlice";
import { canJoinGroup as gateJoinGroup, fitsGenderMode } from "../lib/outings";
import { STRIKE_RELIABILITY } from "../lib/consequences";
import type { GroupGenderMode, Strike } from "../types/outings";

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

export type ConnectionRequestOutcome = 'sent' | 'accepted' | 'exists' | 'connected' | 'blocked' | 'invalid';

/** Adds `id` once (connection lists are sets). */
function addUnique(list: string[] | undefined, id: string): string[] {
  const base = list ?? [];
  return base.includes(id) ? base : [...base, id];
}

/**
 * Nakamas connections are mutual. Drops half-edges (A lists B, B does not
 * list A) that an older removeConnection bug left behind in saved state, so
 * privacy checks never treat a removed or blocked person as a connection.
 * Ids of people not in the list are kept: they cannot be verified here.
 */
export function symmetrizeConnections<T extends { id: string; connections?: string[] }>(users: T[]): T[] {
  const byId = new Map(users.map((u) => [u.id, u]));
  return users.map((u) => {
    const conns = u.connections ?? [];
    const kept = [...new Set(conns)].filter((otherId) => {
      if (otherId === u.id) return false;
      const other = byId.get(otherId);
      return !other || (other.connections ?? []).includes(u.id);
    });
    return kept.length === conns.length && kept.every((id, i) => id === conns[i]) ? u : { ...u, connections: kept };
  });
}

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
  /** Φ26 — what was reported, when it is a specific item (e.g. a wall post). */
  targetType?: 'wall_post' | 'user';
  targetId?: string;
  /** Author of the reported item. */
  targetUserId?: string;
}

/** Φ20 — persisted log of admin moderation actions. */
export interface AdminAction {
  id: string;
  action: string;
  targetId?: string;
  note?: string;
  createdAt: string;
}

/** Φ25 — platform policies toggled from Admin › System (persisted, audited). */
export interface AdminSafeguards {
  autoSuspendNoShow: boolean;
  requireIdForOrganizers: boolean;
  strictAntiSpam: boolean;
  maintenanceMode: boolean;
}

export const DEFAULT_ADMIN_SAFEGUARDS: AdminSafeguards = {
  autoSuspendNoShow: true,
  requireIdForOrganizers: true,
  strictAntiSpam: true,
  maintenanceMode: false,
};

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
    /** Φ26 — comments, reactions, posts on my wall and tags. */
    social: boolean;
  };
  categoryPrefs: string[];
  privacy: AccountPrivacy;
  availability: string[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  twoFactorEnabled: false,
  notificationPrefs: { matches: true, messages: true, reminders: true, promos: false, social: true },
  categoryPrefs: [],
  privacy: { ...DEFAULT_ACCOUNT_PRIVACY },
  availability: ['weekends', 'weekday_evenings'],
};

interface AppState extends OutingsSlice {
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
  /** Last meaningful path for "continue where you left off" on Home. */
  lastResumePath: string | null;
  setLastResumePath: (path: string | null) => void;
  clearLastResumePath: () => void;
  commitmentHolds: Record<string, CommitmentHold>;

  login: (userId: string) => void;
  loginWithUser: (user: User) => void;
  logout: () => void;
  completeOnboarding: () => void;
  addRecentSearch: (query: string) => void;
  getPendingFeedbackEventId: () => string | null;
  canJoinEvent: (eventId: string) => { ok: boolean; messageEl: string; messageEn: string };
  placeCommitmentHold: (eventId: string) => void;
  hasCommitmentHold: (eventId: string) => boolean;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  addMemberToGroup: (groupId: string, userId: string) => void;
  /** Φ27 — `genderMode: 'women_nb'` makes a women & non-binary group (creator must fit). */
  createGroup: (eventId: string, targetSize: number, options?: { genderMode?: GroupGenderMode }) => void;
  becomeEventHost: (eventId: string) => void;
  createEvent: (event: Partial<Event> & { title: string }) => void;
  updateEvent: (eventId: string, patch: Partial<Event>) => void;
  cancelEvent: (eventId: string) => void;
  archiveEvent: (eventId: string) => void;
  publishMeetingPoint: (groupId: string, meetingPoint: string) => void;
  sendGroupAnnouncement: (groupId: string, textEl: string, textEn: string) => void;
  addNotification: (notification: Partial<AppNotification> & Record<string, unknown>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  issueReports: IssueReport[];
  submitIssueReport: (report: Omit<IssueReport, 'id' | 'createdAt' | 'status' | 'reporterUserId'>) => string;
  resolveIssueReport: (id: string, status: IssueReport['status']) => void;
  adminActions: AdminAction[];
  logAdminAction: (action: string, targetId?: string, note?: string) => void;
  organizerMessages: OrganizerMessage[];
  sendOrganizerMessage: (
    organizerId: string,
    message: string,
  ) => { ok: boolean; reasonEl?: string; reasonEn?: string };

  userSettings: UserSettings;
  updateUserSettings: (patch: Partial<UserSettings>) => void;
  updatePrivacySettings: (patch: Partial<UserSettings['privacy']>) => void;

  /** Lean privacy — users the signed-in account has blocked. */
  blockedUserIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;

  bonusXp: number;
  awardXp: (amount: number, reasonEl: string, reasonEn: string) => void;
  challengesJoined: string[];
  toggleChallengeJoined: (challengeId: string) => void;
  /** Φ25 — yyyy-MM-dd of the last claimed daily challenge (one claim per day). */
  dailyChallengeClaimedOn: string | null;
  claimDailyChallenge: (amount: number) => boolean;

  /** Φ25 (port from nakamas, now persisted) — admin user moderation & platform safeguards. */
  suspendedUserIds: string[];
  toggleUserSuspended: (userId: string) => void;
  adminSafeguards: AdminSafeguards;
  setAdminSafeguard: (key: keyof AdminSafeguards, value: boolean) => void;
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
  sidebarCollapsed: boolean;
  setPlansFormingSheetOpen: (open: boolean) => void;
  setPlansFormingSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /**
   * Sends a Nakamas request. Returns what happened so the UI can say it plainly:
   * `accepted` when the other person had already asked (their request is accepted).
   */
  sendConnectionRequest: (toUserId: string, message?: string) => ConnectionRequestOutcome;
  /** Withdraws the viewer's own pending request to `toUserId`. */
  cancelConnectionRequest: (toUserId: string) => void;
  acceptConnectionRequest: (requestId: string) => void;
  declineConnectionRequest: (requestId: string) => void;
  removeConnection: (userId: string) => void;
  /** Restores a connection removed moments ago (Undo on the toast). */
  restoreConnection: (userId: string) => void;

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

const SEED_CONNECTION_REQUESTS: AppState['connectionRequests'] = [
  { id: 'cr1', fromUserId: 'org2', toUserId: 'u1', message: 'We noticed you attended our events. Let\'s connect!', createdAt: '2024-01-15', status: 'pending' as const },
  { id: 'cr2', fromUserId: 'org4', toUserId: 'u1', createdAt: '2024-01-14', status: 'pending' as const },
  { id: 'cr3', fromUserId: 'u4', toUserId: 'u1', message: 'We were in the same cinema group — shall we connect?', createdAt: '2024-01-16', status: 'pending' as const },
];

/** Fired when demo data is reset, so the chat and wall stores reset too. */
export const DEMO_RESET_EVENT = 'nakamas:demo-reset';

/** Φ27 — mock events + Nakamas Nights / small outings, and their groups and people. */
function seedEvents(): Event[] {
  return [...mockEvents, ...mockCalendarPlanEvents, ...mockOutingEvents];
}
function seedGroups(): typeof mockGroups {
  return withOutingPatches([...mockGroups, ...mockCalendarPlanGroups, ...mockOutingGroups]);
}
function seedUsers(): typeof mockUsers {
  return withOutingPeople(mockUsers);
}

/**
 * The demo's data in its original state. Exiting demo mode puts these back,
 * as the demo banner promises («τα demo δεδομένα χάνονται με την Έξοδο»);
 * preferences (theme, home layout, sidebar, language) are kept.
 */
function demoSeedData() {
  return {
    events: seedEvents(),
    groups: seedGroups(),
    users: seedUsers(),
    ...outingsSeedData(),
    notifications: mockNotifications,
    savedEvents: ['e4', 'e3'],
    waitlistedEvents: [] as string[],
    feedbackSubmitted: {} as Record<string, FeedbackData>,
    recentSearches: [] as string[],
    lastResumePath: null as string | null,
    commitmentHolds: {} as Record<string, CommitmentHold>,
    companyRequests: [...mockCompanyRequests],
    companyJoinRequests: [] as CompanyJoinRequest[],
    groupMergeSuggestions: [] as GroupMergeSuggestion[],
    companyRequestReports: [] as CompanyRequestReport[],
    companyRequestPreferences: { ...DEFAULT_COMPANY_REQUEST_PREFS },
    joinRequestRateLog: [] as { userId: string; at: string }[],
    savedCompanyRequestIds: [] as string[],
    dismissedCompanyRequestIds: [] as string[],
    connectionRequests: SEED_CONNECTION_REQUESTS.map((r) => ({ ...r })),
    issueReports: [] as IssueReport[],
    adminActions: [] as AdminAction[],
    organizerMessages: [] as OrganizerMessage[],
    userSettings: { ...DEFAULT_USER_SETTINGS, privacy: { ...DEFAULT_USER_SETTINGS.privacy } },
    bonusXp: 0,
    challengesJoined: ['c1', 'c2'],
    dailyChallengeClaimedOn: null as string | null,
    suspendedUserIds: [] as string[],
    blockedUserIds: [] as string[],
    adminSafeguards: { ...DEFAULT_ADMIN_SAFEGUARDS },
  };
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
    // Φ27 — the unlocked discount comes with a code the whole group sees.
    return withGroupCode({ ...g, discountUnlocked: true, status: g.members.length >= g.targetSize ? 'confirmed' as const : g.status });
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Φ27 — outings: check-in, consequences, waitlists, invites, tickets…
  ...createOutingsSlice(set as never, get as never),
  theme: 'classic',
  setTheme: (theme) => set({ theme }),
  homeHeroMode: 'balanced',
  setHomeHeroMode: (homeHeroMode) => set({ homeHeroMode }),
  events: seedEvents(),
  eventsLoading: false,
  eventsSource: 'mock',
  hydrateEventsFromApi: (events) =>
    set({ events, eventsSource: 'api', eventsLoading: false }),
  setEventsLoading: (eventsLoading) => set({ eventsLoading }),
  groups: seedGroups(),
  users: seedUsers(),
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
  lastResumePath: null,
  setLastResumePath: (path) => set({ lastResumePath: path }),
  clearLastResumePath: () => set({ lastResumePath: null }),
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
  sidebarCollapsed: false,
  setPlansFormingSheetOpen: (open) => set({ plansFormingSheetOpen: open }),
  setPlansFormingSidebarOpen: (open) => set({ plansFormingSidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

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
    // Φ27 — a closed door check-in where I was confirmed opens feedback right away.
    const checkedInEventIds = new Set(
      state.groups
        .filter((g) => g.checkInClosedAt && g.checkIns?.[state.currentUser!.id])
        .map((g) => g.eventId),
    );
    const pending = state.events.find((e) => {
      if (!userGroupEventIds.includes(e.id)) return false;
      if (state.feedbackSubmitted[e.id]) return false;
      if (checkedInEventIds.has(e.id)) return true;
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
      const privacy = { ...state.userSettings.privacy, ...(user.privacy ?? {}) };
      const blockedUserIds = user.blockedUserIds ?? state.blockedUserIds;
      const hydrated = { ...user, privacy, blockedUserIds };
      return {
        currentUser: hydrated,
        isAuthenticated: true,
        demoMode: false,
        userSettings: { ...state.userSettings, privacy },
        blockedUserIds,
        users: state.users.map((u) => (u.id === userId ? hydrated : u)),
      };
    }),

  loginWithUser: (user) =>
    set((state) => {
      const privacy = { ...state.userSettings.privacy, ...(user.privacy ?? {}) };
      const blockedUserIds = user.blockedUserIds ?? state.blockedUserIds;
      const hydrated = { ...user, privacy, blockedUserIds };
      const exists = state.users.some((u) => u.id === user.id);
      return {
        currentUser: hydrated,
        isAuthenticated: true,
        demoMode: false,
        userSettings: { ...state.userSettings, privacy },
        blockedUserIds,
        users: exists
          ? state.users.map((u) => (u.id === user.id ? { ...u, ...hydrated } : u))
          : [...state.users, hydrated],
      };
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

  exitDemoMode: () => {
    const wasDemo = get().demoMode;
    set({
      ...(wasDemo ? demoSeedData() : {}),
      demoMode: false,
      currentUser: null,
      isAuthenticated: false,
    });
    if (wasDemo && typeof window !== 'undefined') {
      // Loaded stores reset themselves; stores never opened this session lose their saved copy.
      window.dispatchEvent(new CustomEvent(DEMO_RESET_EVENT));
      try {
        localStorage.removeItem('nakamas-wall-v1');
      } catch {
        /* storage unavailable — nothing saved to clear */
      }
    }
  },

  joinGroup: (groupId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const userId = state.currentUser.id;
      const target = state.groups.find((g) => g.id === groupId);
      if (!target) return state;
      // Φ27 — one gate for every way in: capacity (→ waitlist), women & non-binary
      // groups, blocks, and a paused standing for groups of strangers.
      const gate = gateJoinGroup(state.currentUser, target, {
        users: state.users,
        strikes: state.strikes,
        blockedUserIds: state.blockedUserIds,
      });
      if (!gate.ok) return state;
      let groups = state.groups.map((g) =>
        g.id === groupId && !g.members.includes(userId)
          ? { ...g, members: [...g.members, userId], waitlist: (g.waitlist ?? []).filter((id) => id !== userId) }
          : g,
      );
      groups = applyGroupDiscount(groups, state.events, groupId);
      // Φ27 — «Η παρέα σου είναι έτοιμη»: the moment the group is complete.
      const confirmed = groups.find((g) => g.id === groupId);
      const ready = target.status !== 'confirmed' && confirmed?.status === 'confirmed';
      const joinerName = state.currentUser.name.split(' ')[0] || 'Nakamas';
      const priorMembers = target.members.filter((id) => id !== userId);
      // Mid-join: tell people already in the forming group (ready fan-out covers the complete case).
      const joinRows =
        !ready && priorMembers.length > 0
          ? priorMembers.map((memberId) =>
              normalizeAppNotification({
                type: 'group',
                messageGr: `Ο/Η ${joinerName} μπήκε στην παρέα — άνοιξε «Η βραδιά μας».`,
                messageEn: `${joinerName} joined the group — open «Our night».`,
                timeGr: 'μόλις τώρα',
                timeEn: 'just now',
                read: false,
                groupId,
                eventId: target.eventId,
                forUserId: memberId,
              }),
            )
          : [];
      if (!ready || !confirmed) {
        return joinRows.length ? { groups, notifications: [...joinRows, ...state.notifications] } : { groups };
      }
      const readyRows = confirmed.members.map((memberId) =>
        normalizeAppNotification({
          type: 'group',
          messageGr: 'Η παρέα σου είναι έτοιμη! Σημείο συνάντησης, κωδικός ομάδας και εισιτήριο πόρτας στη «Βραδιά μας».',
          messageEn: 'Your group is ready! Meeting point, group code and door ticket are on «Our night».',
          timeGr: 'μόλις τώρα',
          timeEn: 'just now',
          read: false,
          groupId,
          eventId: target.eventId,
          forUserId: memberId,
        }),
      );
      return {
        groups,
        notifications: [...readyRows, ...state.notifications],
      };
    }),

  leaveGroup: (groupId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const uid = state.currentUser.id;
      // Keep Plans / BuddySeek in sync: company joins coordinated via this
      // group become withdrawn when the member leaves.
      const reopenedRequestIds = new Set<string>();
      const companyJoinRequests = state.companyJoinRequests.map((j) => {
        const tied =
          j.coordinationGroupId === groupId ||
          j.fromGroupId === groupId ||
          j.targetGroupId === groupId;
        if (!tied) return j;
        if (j.fromUserId !== uid && j.targetUserId !== uid) return j;
        if (j.status !== 'pending' && j.status !== 'accepted') return j;
        reopenedRequestIds.add(j.companyRequestId);
        return { ...j, status: 'withdrawn' as const };
      });
      const companyRequests = state.companyRequests.map((r) =>
        r.matchedGroupId === groupId && r.status === 'matched'
          ? { ...r, status: 'active' as const, matchedGroupId: undefined, updatedAt: new Date().toISOString() }
          : reopenedRequestIds.has(r.id) && r.status === 'matched'
            ? { ...r, status: 'active' as const, matchedGroupId: undefined, updatedAt: new Date().toISOString() }
            : r,
      );
      // Φ27 — seat hand-over: the first person on the waitlist takes the seat at
      // face value; leaving late counts only if the seat stays empty.
      const group = state.groups.find((g) => g.id === groupId);
      const event = group ? state.events.find((e) => e.id === group.eventId) : undefined;
      let nextGroup = group ? { ...group, members: group.members.filter((mId) => mId !== uid) } : undefined;
      let toUserId: string | null = null;
      if (group && group.members.includes(uid)) {
        const handed = handOverSeat(group, uid, {
          users: state.users,
          strikes: state.strikes,
          blockedUserIds: state.blockedUserIds,
          price: event?.isPaid ? event.price : 0,
        });
        nextGroup = handed.group;
        toUserId = handed.toUserId;
      }
      const start = eventStartMs(event);
      const late =
        Boolean(group?.members.includes(uid)) &&
        group?.status === 'confirmed' &&
        !toUserId &&
        start !== null &&
        start > Date.now() &&
        start - Date.now() < LATE_CANCEL_MS;
      let strikes = state.strikes;
      let people = { users: state.users, currentUser: state.currentUser };
      const notifications = [...state.notifications];
      const note = (
        messageGr: string,
        messageEn: string,
        type = 'group',
        extra: { groupId?: string | null; eventId?: string; forUserId?: string } = {},
      ) =>
        notifications.unshift(
          normalizeAppNotification({
            type,
            messageGr,
            messageEn,
            timeGr: 'μόλις τώρα',
            timeEn: 'just now',
            read: false,
            // Explicit null clears the default so leave-trail does not deep-link a locked night.
            groupId: Object.prototype.hasOwnProperty.call(extra, 'groupId')
              ? (extra.groupId ?? undefined)
              : groupId,
            eventId: extra.eventId ?? group?.eventId,
            forUserId: extra.forUserId,
          }),
        );
      if (late && group) {
        const delta = STRIKE_RELIABILITY.late_cancel;
        const strike: Strike = {
          id: `st_${Date.now().toString(36)}`,
          userId: uid,
          kind: 'late_cancel',
          at: new Date().toISOString(),
          groupId,
          eventId: group.eventId,
          reliabilityDelta: delta,
        };
        strikes = [...strikes, strike];
        people = patchPerson(people, uid, (u) => ({ reliabilityScore: Math.min(100, Math.max(0, u.reliabilityScore + delta)) }));
        note(
          'Αποχώρησες λιγότερο από 24 ώρες πριν και η θέση έμεινε κενή — καταγράφηκε αργή ακύρωση. Αν υπήρχε σοβαρός λόγος, κάνε ένσταση στο Κέντρο Εμπιστοσύνης.',
          'You left less than 24 hours before and the seat stayed empty — a late cancel was recorded. If there was a serious reason, appeal in the Trust Center.',
          'safety',
          // Scoped to the leaver; clear groupId so the row does not deep-link a locked night.
          { forUserId: uid, groupId: null },
        );
      }
      if (toUserId) {
        note(
          'Η θέση σου πέρασε στο πρώτο άτομο της λίστας αναμονής, στην ίδια τιμή. Η ομάδα κρατά την έκπτωση.',
          'Your seat passed to the first person on the waitlist, at the same price. The group keeps its discount.',
          'group',
          { forUserId: uid, groupId: null },
        );
        // Loyalty: the waitlist winner must learn the seat is theirs (not only the leaver).
        note(
          'Άνοιξε θέση για σένα — πέρασες από τη λίστα αναμονής στην ομάδα, στην ίδια τιμή. Άνοιξε «Η βραδιά μας».',
          'A seat opened for you — you moved from the waitlist into the group at the same price. Open «Our night».',
          'group',
          { groupId, eventId: group?.eventId, forUserId: toUserId },
        );
      } else if (!late && group?.members.includes(uid)) {
        // Quiet leave (no late strike, no hand-over) still leaves a trail back to plans — not /night.
        note(
          'Αποχώρησες από την ομάδα. Μπορείς να βρεις άλλη παρέα στα σχέδιά σου ή στο «Βρες Nakamas».',
          'You left the group. You can find another company in My plans or Find Nakamas.',
          'group',
          { forUserId: uid, groupId: null },
        );
      }
      // Remaining members learn the roster changed without opening Our night by chance.
      const remaining = (nextGroup?.members ?? group?.members.filter((id) => id !== uid) ?? []).filter(
        (id) => id !== uid && id !== toUserId,
      );
      for (const memberId of remaining) {
        note(
          'Ένα μέλος αποχώρησε από την παρέα — δες την ενημερωμένη ομάδα στη «Βραδιά μας».',
          'A member left the group — see the updated roster on «Our night».',
          'group',
          { forUserId: memberId, groupId },
        );
      }
      // Release the commitment hold for an event the member is no longer going to.
      let commitmentHolds = state.commitmentHolds;
      if (group && commitmentHolds[group.eventId]) {
        const stillGoing = state.groups.some((g) => g.id !== groupId && g.eventId === group.eventId && g.members.includes(uid));
        if (!stillGoing) {
          const { [group.eventId]: _released, ...rest } = commitmentHolds;
          commitmentHolds = rest;
        }
      }
      return {
        groups: state.groups.map((g) => (g.id === groupId && nextGroup ? nextGroup : g)),
        companyJoinRequests,
        companyRequests,
        strikes,
        users: people.users,
        currentUser: people.currentUser,
        notifications,
        commitmentHolds,
      };
    }),

  addMemberToGroup: (groupId, userId) =>
    set((state) => {
      const target = state.groups.find((g) => g.id === groupId);
      if (!target || target.members.includes(userId)) return state;
      let groups = state.groups.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, userId], waitlist: (g.waitlist ?? []).filter((id) => id !== userId) } : g,
      );
      groups = applyGroupDiscount(groups, state.events, groupId);
      const after = groups.find((g) => g.id === groupId);
      const ready = target.status !== 'confirmed' && after?.status === 'confirmed';
      const joiner = state.users.find((u) => u.id === userId);
      const joinerName = joiner?.name.split(' ')[0] || 'Nakamas';
      const peerRows = target.members.map((memberId) =>
        normalizeAppNotification({
          type: 'group',
          messageGr: `Ο/Η ${joinerName} μπήκε στην παρέα — άνοιξε «Η βραδιά μας».`,
          messageEn: `${joinerName} joined the group — open «Our night».`,
          timeGr: 'μόλις τώρα',
          timeEn: 'just now',
          read: false,
          groupId,
          eventId: target.eventId,
          forUserId: memberId,
        }),
      );
      const selfRow = normalizeAppNotification({
        type: 'group',
        messageGr: 'Μπήκες στην παρέα — άνοιξε «Η βραδιά μας» για σημείο συνάντησης και chat.',
        messageEn: 'You were added to the group — open «Our night» for meeting point and chat.',
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        groupId,
        eventId: target.eventId,
        forUserId: userId,
      });
      const readyRows =
        ready && after
          ? after.members.map((memberId) =>
              normalizeAppNotification({
                type: 'group',
                messageGr: 'Η παρέα σου είναι έτοιμη! Σημείο συνάντησης, κωδικός ομάδας και εισιτήριο πόρτας στη «Βραδιά μας».',
                messageEn: 'Your group is ready! Meeting point, group code and door ticket are on «Our night».',
                timeGr: 'μόλις τώρα',
                timeEn: 'just now',
                read: false,
                groupId,
                eventId: target.eventId,
                forUserId: memberId,
              }),
            )
          : [];
      return {
        groups,
        notifications: [...(ready ? readyRows : [...peerRows, selfRow]), ...state.notifications],
      };
    }),

  createGroup: (eventId, targetSize, options) =>
    set((state) => {
      if (!state.currentUser) return state;
      const genderMode: GroupGenderMode =
        options?.genderMode === 'women_nb' && fitsGenderMode(state.currentUser, 'women_nb') ? 'women_nb' : 'mixed';
      const newGroup = {
        genderMode,
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

  cancelEvent: (eventId) => {
    const memberIds = Array.from(
      new Set(
        get()
          .groups.filter((g) => g.eventId === eventId)
          .flatMap((g) => g.members),
      ),
    );
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: 'cancelled' as const } : e,
      ),
      groups: state.groups.map((g) =>
        g.eventId === eventId ? { ...g, status: 'cancelled' as const } : g,
      ),
    }));
    const stamp = Date.now();
    for (let i = 0; i < memberIds.length; i++) {
      get().addNotification({
        id: `n_cancel_${stamp}_${i}`,
        type: 'group',
        messageGr: 'Η εκδήλωση ακυρώθηκε. Δες τα σχέδιά σου για εναλλακτικές.',
        messageEn: 'The event was cancelled. Check My plans for alternatives.',
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        eventId,
        forUserId: memberIds[i],
      });
    }
  },

  archiveEvent: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: 'archived' as const } : e,
      ),
    })),

  publishMeetingPoint: (groupId, meetingPoint) => {
    const group = get().groups.find((g) => g.id === groupId);
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, meetingPoint } : g,
      ),
    }));
    if (!group) return;
    const stamp = Date.now();
    const targets = group.members.filter((id) => id !== get().currentUser?.id);
    for (let i = 0; i < targets.length; i++) {
      get().addNotification({
        id: `n_meet_${stamp}_${i}`,
        type: 'group',
        messageGr: 'Δημοσιεύτηκε σημείο συνάντησης — άνοιξε «Η βραδιά μας».',
        messageEn: 'A meeting point was published — open «Our night».',
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        groupId,
        eventId: group.eventId,
        forUserId: targets[i],
      });
    }
  },

  sendGroupAnnouncement: (groupId, textEl, textEn) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (!group) return;
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, lastAnnouncement: { textEl, textEn, at: new Date().toISOString() } }
          : g,
      ),
    }));
    const stamp = Date.now();
    for (let i = 0; i < group.members.length; i++) {
      get().addNotification({
        id: `n_ann_${stamp}_${i}`,
        type: 'group',
        messageEn: `Organizer announcement: ${textEn}`,
        messageGr: `Ανακοίνωση διοργανωτή: ${textEl}`,
        timeEn: 'Just now',
        timeGr: 'Μόλις τώρα',
        color: 'bg-cyan-100 text-cyan-600',
        groupId,
        eventId: group.eventId,
        forUserId: group.members[i],
      });
    }
  },

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
        { id: `aa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, action, targetId, note, createdAt: new Date().toISOString() },
        ...state.adminActions,
      ],
    })),

  organizerMessages: [],
  sendOrganizerMessage: (organizerId, message) => {
    const state = get();
    const subject = state.users.find((u) => u.id === organizerId);
    const gate = canViewerContactOrganizer(state.currentUser, subject, {
      blockedUserIds: state.blockedUserIds,
      groups: state.groups,
    });
    if (!gate.allowed) {
      return { ok: false, reasonEl: gate.reasonEl, reasonEn: gate.reasonEn };
    }
    set((s) => ({
      organizerMessages: [
        {
          id: `om_${Date.now()}`,
          organizerId,
          fromUserId: s.currentUser?.id,
          message,
          createdAt: new Date().toISOString(),
        },
        ...s.organizerMessages,
      ],
    }));
    return { ok: true };
  },

  userSettings: { ...DEFAULT_USER_SETTINGS },
  updateUserSettings: (patch) =>
    set((state) => {
      const privacy = { ...state.userSettings.privacy, ...(patch.privacy ?? {}) };
      const nextSettings = {
        ...state.userSettings,
        ...patch,
        notificationPrefs: { ...state.userSettings.notificationPrefs, ...(patch.notificationPrefs ?? {}) },
        privacy,
      };
      const uid = state.currentUser?.id;
      return {
        userSettings: nextSettings,
        ...(patch.privacy && uid
          ? {
              currentUser: state.currentUser
                ? { ...state.currentUser, privacy }
                : null,
              users: state.users.map((u) => (u.id === uid ? { ...u, privacy } : u)),
            }
          : {}),
      };
    }),

  updatePrivacySettings: (patch) =>
    set((state) => {
      const privacy: AccountPrivacy = { ...state.userSettings.privacy, ...patch };
      // A coarse visibility change without a fine audience (AI, legacy select)
      // replaces any earlier fine-grained choice instead of leaving it to revive later.
      if (patch.profileVisibility && !('profileAudience' in patch)) delete privacy.profileAudience;
      if (privacy.profileAudience) privacy.profileVisibility = audienceToProfileVisibility(privacy.profileAudience);
      const uid = state.currentUser?.id;
      return {
        userSettings: {
          ...state.userSettings,
          privacy,
        },
        currentUser: state.currentUser ? { ...state.currentUser, privacy } : null,
        users: uid
          ? state.users.map((u) => (u.id === uid ? { ...u, privacy } : u))
          : state.users,
      };
    }),

  blockedUserIds: [],
  blockUser: (userId) => {
    const myId = get().currentUser?.id;
    if (!myId || !userId || userId === myId) return;
    set((state) => {
      const blockedUserIds = state.blockedUserIds.includes(userId)
        ? state.blockedUserIds
        : [...state.blockedUserIds, userId];
      const syncBlocked = (u: User): User =>
        u.id === myId ? { ...u, blockedUserIds } : u;
      return {
        blockedUserIds,
        currentUser: state.currentUser ? syncBlocked(state.currentUser) : null,
        users: state.users.map(syncBlocked),
        // Drop connection both ways when blocking.
        connectionRequests: state.connectionRequests.filter(
          (r) =>
            !(
              (r.fromUserId === myId && r.toUserId === userId) ||
              (r.fromUserId === userId && r.toUserId === myId)
            ),
        ),
      };
    });
    // Drop the Nakamas edge on both sides (idempotent — also clears half-edges).
    get().removeConnection(userId);
  },
  unblockUser: (userId) => {
    const myId = get().currentUser?.id;
    if (!myId || !userId) return;
    set((state) => {
      const blockedUserIds = state.blockedUserIds.filter((id) => id !== userId);
      const syncBlocked = (u: User): User =>
        u.id === myId ? { ...u, blockedUserIds } : u;
      return {
        blockedUserIds,
        currentUser: state.currentUser ? syncBlocked(state.currentUser) : null,
        users: state.users.map(syncBlocked),
      };
    });
  },

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
          forUserId: state.currentUser?.id,
        }),
        ...state.notifications,
      ],
    })),

  challengesJoined: ['c1', 'c2'],
  toggleChallengeJoined: (challengeId) =>
    set((state) => ({
      challengesJoined: state.challengesJoined.includes(challengeId)
        ? state.challengesJoined.filter((id) => id !== challengeId)
        : [...state.challengesJoined, challengeId],
    })),

  dailyChallengeClaimedOn: null,
  claimDailyChallenge: (amount) => {
    const today = new Date().toISOString().slice(0, 10);
    if (get().dailyChallengeClaimedOn === today) return false;
    set({ dailyChallengeClaimedOn: today });
    get().awardXp(amount, 'Ημερήσια πρόκληση', 'Daily challenge');
    return true;
  },

  suspendedUserIds: [],
  toggleUserSuspended: (userId) => {
    const suspended = get().suspendedUserIds.includes(userId);
    set((state) => ({
      suspendedUserIds: suspended
        ? state.suspendedUserIds.filter((id) => id !== userId)
        : [...state.suspendedUserIds, userId],
    }));
    get().logAdminAction(suspended ? 'restore_user' : 'suspend_user', userId);
  },
  adminSafeguards: { ...DEFAULT_ADMIN_SAFEGUARDS },
  setAdminSafeguard: (key, value) => {
    set((state) => ({ adminSafeguards: { ...state.adminSafeguards, [key]: value } }));
    get().logAdminAction(`safeguard_${key}_${value ? 'on' : 'off'}`);
  },

  updateUser: (userId, rawData) =>
    set((state) => {
      // The admin role is never changed from the client (see lib/roles.ts).
      const { isAdmin: _ignoredAdmin, ...data } = (rawData ?? {}) as Partial<typeof currentUser> & { isAdmin?: boolean };
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

  connectionRequests: SEED_CONNECTION_REQUESTS.map((r) => ({ ...r })),

  sendConnectionRequest: (toUserId, message) => {
    const state = get();
    const me = state.currentUser;
    if (!me || !toUserId || toUserId === me.id) return 'invalid';
    const peer = state.users.find((u) => u.id === toUserId);
    if (!peer) return 'invalid';
    if (state.blockedUserIds.includes(toUserId) || (peer.blockedUserIds ?? []).includes(me.id)) return 'blocked';
    if ((me.connections ?? []).includes(toUserId)) return 'connected';
    // They already asked: saying yes is what the person means.
    const reverse = state.connectionRequests.find(
      (r) => r.fromUserId === toUserId && r.toUserId === me.id && r.status === 'pending',
    );
    if (reverse) {
      get().acceptConnectionRequest(reverse.id);
      return 'accepted';
    }
    const exists = state.connectionRequests.some(
      (r) => r.fromUserId === me.id && r.toUserId === toUserId && r.status === 'pending',
    );
    if (exists) return 'exists';
    const fromName = me.name.split(' ')[0] || 'Nakamas';
    set((s) => ({
      connectionRequests: [
        ...s.connectionRequests,
        {
          id: `cr${Date.now()}`,
          fromUserId: me.id,
          toUserId,
          message: message?.trim() ? message.trim().slice(0, 300) : undefined,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'pending' as const,
        },
      ],
      notifications: [
        normalizeAppNotification({
          type: 'system',
          messageGr: `Νέο αίτημα σύνδεσης από ${fromName} — άνοιξε «Οι Συνδέσεις μου».`,
          messageEn: `New connection request from ${fromName} — open My Nakamas.`,
          timeGr: 'μόλις τώρα',
          timeEn: 'just now',
          read: false,
          forUserId: toUserId,
        }),
        ...s.notifications,
      ],
    }));
    return 'sent';
  },

  cancelConnectionRequest: (toUserId) =>
    set((state) => {
      const myId = state.currentUser?.id;
      if (!myId) return state;
      return {
        connectionRequests: state.connectionRequests.filter(
          (r) => !(r.fromUserId === myId && r.toUserId === toUserId && r.status === 'pending'),
        ),
      };
    }),

  acceptConnectionRequest: (requestId) =>
    set((state) => {
      const req = state.connectionRequests.find((r) => r.id === requestId);
      if (!req || !state.currentUser || req.status !== 'pending') return state;
      const myId = state.currentUser.id;
      // Only the person who received the request can accept it.
      if (req.toUserId !== myId) return state;
      const acceptor = state.currentUser;
      const link = <U extends { id: string; connections?: string[] }>(u: U): U => {
        if (u.id === req.fromUserId) return { ...u, connections: addUnique(u.connections, req.toUserId) };
        if (u.id === req.toUserId) return { ...u, connections: addUnique(u.connections, req.fromUserId) };
        return u;
      };
      return {
        connectionRequests: state.connectionRequests.map((r) =>
          r.id === requestId ||
          // A crossing request in the other direction is settled by the same yes.
          (r.status === 'pending' && r.fromUserId === req.toUserId && r.toUserId === req.fromUserId)
            ? { ...r, status: 'accepted' as const }
            : r,
        ),
        users: state.users.map(link),
        currentUser: link(state.currentUser),
        notifications: [
          normalizeAppNotification({
            type: 'system',
            messageGr: `Ο/Η ${acceptor.name.split(' ')[0]} αποδέχτηκε τη σύνδεση — δες τον τοίχο των Nakamas σου.`,
            messageEn: `${acceptor.name.split(' ')[0]} accepted your connection — see your Nakamas wall.`,
            timeGr: 'μόλις τώρα',
            timeEn: 'just now',
            read: false,
            forUserId: req.fromUserId,
          }),
          ...state.notifications,
        ],
      };
    }),

  declineConnectionRequest: (requestId) =>
    set((state) => {
      const req = state.connectionRequests.find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return state;
      const declinerName = state.currentUser?.name.split(' ')[0] || 'Nakamas';
      return {
        connectionRequests: state.connectionRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'declined' as const } : r,
        ),
        notifications: [
          normalizeAppNotification({
            type: 'system',
            messageGr: `Το αίτημα σύνδεσης προς ${declinerName} απορρίφθηκε.`,
            messageEn: `Your connection request to ${declinerName} was declined.`,
            timeGr: 'μόλις τώρα',
            timeEn: 'just now',
            read: false,
            forUserId: req.fromUserId,
          }),
          ...state.notifications,
        ],
      };
    }),

  removeConnection: (userId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const myId = state.currentUser.id;
      return {
        users: state.users.map((u) => {
          if (u.id === myId) return { ...u, connections: (u.connections || []).filter((id) => id !== userId) };
          // Mutual edge: the other person must stop listing me too (privacy ACL reads both sides).
          if (u.id === userId) return { ...u, connections: (u.connections || []).filter((id) => id !== myId) };
          return u;
        }),
        currentUser: { ...state.currentUser, connections: (state.currentUser.connections || []).filter((id) => id !== userId) },
      };
    }),

  restoreConnection: (userId) =>
    set((state) => {
      if (!state.currentUser || userId === state.currentUser.id) return state;
      const myId = state.currentUser.id;
      if (state.blockedUserIds.includes(userId)) return state;
      if (!state.users.some((u) => u.id === userId)) return state;
      return {
        users: state.users.map((u) => {
          if (u.id === myId) return { ...u, connections: addUnique(u.connections, userId) };
          if (u.id === userId) return { ...u, connections: addUnique(u.connections, myId) };
          return u;
        }),
        currentUser: { ...state.currentUser, connections: addUnique(state.currentUser.connections, userId) },
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
        notifications: join.targetUserId
          ? [
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
                forUserId: join.targetUserId,
              }),
              ...state.notifications,
            ]
          : state.notifications,
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
            type: 'group',
            messageEn: 'You are in — open «Our night» for the meeting spot and chat.',
            messageGr: 'Μπήκες — άνοιξε «Η βραδιά μας» για σημείο συνάντησης και chat.',
            timeEn: 'Just now',
            timeGr: 'Μόλις τώρα',
            icon: Users,
            color: 'bg-emerald-100 text-emerald-700',
            groupId: coordinationGroupId!,
            eventId: companyRequest.eventId,
            forUserId: join.fromUserId,
          }),
          ...state.notifications,
        ],
      };
    });
    if (coordinationGroupId) {
      const snap = get();
      const group = snap.groups.find((g) => g.id === coordinationGroupId);
      const event = group ? snap.events.find((e) => e.id === group.eventId) : undefined;
      if (group) {
        useChatStore.getState().ensureEventGroupConversation({
          groupId: group.id,
          eventId: group.eventId,
          title: event?.title ?? 'Nakamas',
          participantUserIds: group.members,
          meetingPoint: event?.locationArea,
        });
      }
    }
    return coordinationGroupId;
  },

  declineCompanyJoinRequest: (joinRequestId) =>
    set((state) => {
      const join = state.companyJoinRequests.find((j) => j.id === joinRequestId);
      if (!join || join.status !== 'pending') {
        return {
          companyJoinRequests: state.companyJoinRequests.map((j) =>
            j.id === joinRequestId ? { ...j, status: 'declined' as const } : j,
          ),
        };
      }
      const companyRequest = state.companyRequests.find((r) => r.id === join.companyRequestId);
      const event = companyRequest
        ? state.events.find((e) => e.id === companyRequest.eventId)
        : undefined;
      return {
        companyJoinRequests: state.companyJoinRequests.map((j) =>
          j.id === joinRequestId ? { ...j, status: 'declined' as const } : j,
        ),
        notifications: [
          normalizeAppNotification({
            id: `n_cjr_dec_${Date.now()}`,
            type: 'buddy_seek',
            messageEn: event
              ? `Your join request for "${event.title}" was declined`
              : 'Your company join request was declined',
            messageGr: event
              ? `Το αίτημά σου για «${event.title}» απορρίφθηκε`
              : 'Το αίτημα παρέας σου απορρίφθηκε',
            timeEn: 'Just now',
            timeGr: 'Μόλις τώρα',
            icon: Users,
            color: 'bg-rose-100 text-rose-700',
            forUserId: join.fromUserId,
          }),
          ...state.notifications,
        ],
      };
    }),

  withdrawCompanyJoinRequest: (joinRequestId) =>
    set((state) => {
      const join = state.companyJoinRequests.find((j) => j.id === joinRequestId);
      if (!join || join.status !== 'pending') {
        return {
          companyJoinRequests: state.companyJoinRequests.map((j) =>
            j.id === joinRequestId ? { ...j, status: 'withdrawn' as const } : j,
          ),
        };
      }
      const companyRequest = state.companyRequests.find((r) => r.id === join.companyRequestId);
      const event = companyRequest
        ? state.events.find((e) => e.id === companyRequest.eventId)
        : undefined;
      const targetId = join.targetUserId;
      return {
        companyJoinRequests: state.companyJoinRequests.map((j) =>
          j.id === joinRequestId ? { ...j, status: 'withdrawn' as const } : j,
        ),
        // Notify the plan owner that the requester withdrew (same inbox stream).
        notifications: targetId
          ? [
              normalizeAppNotification({
                id: `n_cjr_wd_${Date.now()}`,
                type: 'buddy_seek',
                messageEn: event
                  ? `Someone withdrew their join request for "${event.title}"`
                  : 'A company join request was withdrawn',
                messageGr: event
                  ? `Κάποιος ανακάλεσε το αίτημα για «${event.title}»`
                  : 'Ανακλήθηκε αίτημα παρέας',
                timeEn: 'Just now',
                timeGr: 'Μόλις τώρα',
                icon: Users,
                color: 'bg-amber-100 text-amber-700',
                forUserId: targetId,
              }),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }),

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
      const to = state.groups.find((g) => g.id === toGroupId);
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
      const targetHost = to?.hostId;
      const fromName = state.currentUser.name.split(' ')[0] || 'Nakamas';
      const hostNotif =
        targetHost && targetHost !== state.currentUser.id
          ? [
              normalizeAppNotification({
                type: 'buddy_seek',
                messageGr: `Ο/Η ${fromName} πρότεινε συγχώνευση ομάδων — δες το στο «Βρες Nakamas».`,
                messageEn: `${fromName} suggested merging groups — review it in Find Nakamas.`,
                timeGr: 'μόλις τώρα',
                timeEn: 'just now',
                read: false,
                groupId: toGroupId,
                eventId: from.eventId,
                forUserId: targetHost,
              }),
            ]
          : [];
      return {
        groupMergeSuggestions: [...state.groupMergeSuggestions, suggestion],
        notifications: [...hostNotif, ...state.notifications],
      };
    }),

  respondGroupMerge: (suggestionId, accept) => {
    let resultGroupId: string | null = null;
    let declinedFor: string | null = null;
    set((state) => {
      const suggestion = state.groupMergeSuggestions.find((s) => s.id === suggestionId);
      if (!suggestion || !state.currentUser) return state;
      if (!accept) {
        declinedFor = suggestion.fromUserId;
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
    if (!accept && declinedFor) {
      get().addNotification({
        type: 'buddy_seek',
        messageGr: 'Η πρόταση συγχώνευσης απορρίφθηκε.',
        messageEn: 'The group-merge suggestion was declined.',
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        forUserId: declinedFor,
      });
    }
    if (resultGroupId) {
      const snap = get();
      const group = snap.groups.find((g) => g.id === resultGroupId);
      const event = group ? snap.events.find((e) => e.id === group.eventId) : undefined;
      if (group) {
        useChatStore.getState().ensureEventGroupConversation({
          groupId: group.id,
          eventId: group.eventId,
          title: event?.title ?? 'Nakamas',
          participantUserIds: group.members,
          meetingPoint: event?.locationArea,
        });
        const stamp = Date.now();
        for (let i = 0; i < group.members.length; i++) {
          get().addNotification({
            id: `n_merge_${stamp}_${i}`,
            type: 'group',
            messageGr: 'Οι ομάδες ενώθηκαν — άνοιξε «Η βραδιά μας» για τη νέα παρέα.',
            messageEn: 'Groups merged — open «Our night» for the new company.',
            timeGr: 'μόλις τώρα',
            timeEn: 'just now',
            read: false,
            groupId: group.id,
            eventId: group.eventId,
            forUserId: group.members[i],
          });
        }
      }
    }
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
        lastResumePath: state.lastResumePath,
        commitmentHolds: state.commitmentHolds,
        companyRequests: state.companyRequests,
        companyRequestPreferences: state.companyRequestPreferences,
        companyJoinRequests: state.companyJoinRequests,
        savedCompanyRequestIds: state.savedCompanyRequestIds,
        dismissedCompanyRequestIds: state.dismissedCompanyRequestIds,
        plansFormingSidebarOpen: state.plansFormingSidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
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
        dailyChallengeClaimedOn: state.dailyChallengeClaimedOn,
        suspendedUserIds: state.suspendedUserIds,
        blockedUserIds: state.blockedUserIds,
        adminSafeguards: state.adminSafeguards,
        demoMode: state.demoMode,
        // Φ27 — outings
        strikes: state.strikes,
        planInvites: state.planInvites,
        followedOrganizerIds: state.followedOrganizerIds,
        govWalletInterest: state.govWalletInterest,
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
        // isAdmin comes only from the trusted seeds, never from persisted
        // (user-editable) localStorage state.
        const seedAdmin = new Map(current.users.map((u) => [u.id, Boolean(u.isAdmin)]));
        // blob: photo links saved by older builds die on reload — fall back to the seed photo.
        const seedPhoto = new Map(current.users.map((u) => [u.id, u.photoUrl]));
        const users = symmetrizeConnections(
          withOutingPeople(mergeById(current.users, p.users)).map((u) => ({
            ...u,
            isAdmin: seedAdmin.get(u.id) ?? false,
            photoUrl: u.photoUrl?.startsWith('blob:') ? seedPhoto.get(u.id) : u.photoUrl,
          })),
        );
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
          adminSafeguards: { ...DEFAULT_ADMIN_SAFEGUARDS, ...(p.adminSafeguards as object) },
          suspendedUserIds: Array.isArray(p.suspendedUserIds) ? (p.suspendedUserIds as string[]) : [],
          blockedUserIds: Array.isArray(p.blockedUserIds) ? (p.blockedUserIds as string[]) : [],
          strikes: Array.isArray(p.strikes) ? (p.strikes as typeof current.strikes) : current.strikes,
          planInvites: mergeById(current.planInvites, p.planInvites),
          followedOrganizerIds: Array.isArray(p.followedOrganizerIds) ? (p.followedOrganizerIds as string[]) : [],
          govWalletInterest: Boolean(p.govWalletInterest),
        };
      },
    },
  ),
);
