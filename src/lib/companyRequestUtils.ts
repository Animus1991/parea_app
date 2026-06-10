import type {
  CompanyRequest,
  CompanyRequestPreferences,
  ProfileExposure,
  VisibilityMode,
} from '../types/companyRequest';
import type { Event, Group, User } from '../types';

/** Migrate legacy buddy-seek intents from store persist. */
export function normalizeCompanyRequest(raw: Record<string, unknown>): CompanyRequest {
  const visibility = (raw.visibilityMode ?? raw.visibility ?? 'similar_interests') as VisibilityMode;
  const legacyVis = raw.visibility as string | undefined;
  let visibilityMode: VisibilityMode = visibility;
  if (legacyVis === 'hidden') visibilityMode = 'private';
  if (legacyVis === 'all_logged_in') visibilityMode = 'public_event_page';

  const matchPref = raw.matchPreference as string | undefined;
  let lookingForType = (raw.lookingForType as CompanyRequest['lookingForType']) ?? 'open_to_suggestions';
  if (!raw.lookingForType && matchPref === 'individuals') lookingForType = 'find_people';
  if (!raw.lookingForType && matchPref === 'groups') lookingForType = 'join_group';

  return {
    id: String(raw.id),
    eventId: String(raw.eventId),
    creatorUserId: String(raw.creatorUserId ?? raw.userId),
    lookingForType,
    message: raw.message as string | undefined,
    preferredGroupMin: raw.preferredGroupMin as number | undefined,
    preferredGroupMax: raw.preferredGroupMax as number | undefined,
    flexibleDates: Boolean(raw.flexibleDates),
    preferredDateTime: raw.preferredDateTime as string | undefined,
    meetingPreference: (raw.meetingPreference as CompanyRequest['meetingPreference']) ?? 'chat_first',
    visibilityMode,
    profileExposure: (raw.profileExposure as ProfileExposure) ?? 'interests_only',
    requiredTrustTier: (raw.requiredTrustTier as CompanyRequest['requiredTrustTier']) ?? 'none',
    status: (raw.status as CompanyRequest['status']) ?? 'active',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    expiresAt: raw.expiresAt as string | undefined,
    matchedGroupId: raw.matchedGroupId as string | undefined,
    openToJoinGroup: raw.openToJoinGroup as boolean | undefined,
    reportCountInternal: raw.reportCountInternal as number | undefined,
  };
}

export function sharedInterestCount(a: User, b: User, event?: Event): number {
  const tags = new Set((event?.tags ?? []).map((t) => t.toLowerCase()));
  if (event?.category) tags.add(event.category.toLowerCase());
  const pool = [...(a.interests ?? []), ...tags];
  return (b.interests ?? []).filter((i) =>
    pool.some(
      (p) =>
        p.toLowerCase() === i.toLowerCase() ||
        p.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(p.toLowerCase()),
    ),
  ).length;
}

export function canViewerSeeRequest(
  viewer: User | null,
  request: CompanyRequest,
  creator: User | null,
  event: Event,
  ctx: {
    groups: Group[];
    viewerViewingEventId?: string;
    viewerAlsoSeekingEvent?: boolean;
  },
): boolean {
  if (!viewer) return false;
  if (request.creatorUserId === viewer.id) return true;
  if (request.status !== 'active') return false;
  if (request.visibilityMode === 'private') return false;

  const { visibilityMode } = request;

  if (visibilityMode === 'public_event_page') return true;
  if (visibilityMode === 'organizer_only') return viewer.id === event.organizerId;
  if (visibilityMode === 'verified_users') {
    return viewer.phoneVerified || viewer.paymentVerified || viewer.idVerified;
  }
  if (visibilityMode === 'existing_groups') {
    return ctx.groups.some(
      (g) => g.eventId === event.id && (g.hostId === viewer.id || g.members.includes(viewer.id)),
    );
  }
  if (visibilityMode === 'same_event_viewers') {
    return ctx.viewerViewingEventId === event.id || Boolean(ctx.viewerAlsoSeekingEvent);
  }
  if (visibilityMode === 'similar_interests') {
    if (!creator) return false;
    return sharedInterestCount(viewer, creator, event) >= 1 || Boolean(ctx.viewerAlsoSeekingEvent);
  }
  return false;
}

export function projectRequestForViewer(
  request: CompanyRequest,
  creator: User,
  event: Event,
  viewer: User | null,
  prefs: CompanyRequestPreferences,
): {
  displayName: string;
  showPhoto: boolean;
  interests: string[];
  interestLabel: string;
  trustLabel: string;
  variant: 'anonymous' | 'limited' | 'group';
} {
  const shared = viewer ? sharedInterestCount(viewer, creator, event) : 0;
  const exposure = request.profileExposure;

  if (exposure === 'anonymous') {
    return {
      displayName: '',
      showPhoto: false,
      interests: [],
      interestLabel:
        shared > 0
          ? `${shared} shared interests`
          : 'Someone looking for company',
      trustLabel: '',
      variant: 'anonymous',
    };
  }

  const showPhoto =
    exposure === 'optional_photo' || exposure === 'mini_profile'
      ? prefs.showPhotoInDiscovery && prefs.photoRevealPolicy === 'in_cards_opt_in' && !!creator.photoUrl
      : false;

  let interests: string[] = [];
  if (prefs.interestVisibility === 'all') interests = creator.interests ?? [];
  else if (prefs.interestVisibility === 'shared_only' && viewer) {
    interests = (creator.interests ?? []).filter((i) =>
      (viewer.interests ?? []).some((v) => v.toLowerCase() === i.toLowerCase()),
    );
  }

  const displayName =
    exposure === 'nickname' || exposure === 'mini_profile' ? creator.name.split(' ')[0] : '';

  return {
    displayName,
    showPhoto,
    interests,
    interestLabel:
      prefs.interestVisibility === 'count_only'
        ? `${Math.max(shared, interests.length)} interests`
        : '',
    trustLabel: exposure === 'trust_badges' || exposure === 'mini_profile' ? creator.trustTier : '',
    variant: 'limited',
  };
}

export function audienceSummary(mode: VisibilityMode, t: (el: string, en: string) => string): string {
  const map: Record<VisibilityMode, [string, string]> = {
    private: ['Μόνο εσείς', 'Only you'],
    similar_interests: ['Χρήστες με κοινά ενδιαφέροντα', 'Users with shared interests'],
    same_event_viewers: ['Όσοι βλέπουν την ίδια εκδήλωση', 'People viewing this event'],
    verified_users: ['Επαληθευμένοι χρήστες', 'Verified users'],
    existing_groups: ['Ομάδες για την εκδήλωση', 'Groups for this event'],
    organizer_only: ['Μόνο διοργανωτής', 'Organizer only'],
    public_event_page: ['Σελίδα εκδήλωσης (επιλεγμένα πεδία)', 'Event page (selected fields only)'],
  };
  const pair = map[mode];
  return t(pair[0], pair[1]);
}

export function exposureSummary(exposure: ProfileExposure, t: (el: string, en: string) => string): string {
  const map: Record<ProfileExposure, [string, string]> = {
    anonymous: ['Ανώνυμο αίτημα', 'Anonymous intent'],
    nickname: ['Όνομα / ψευδώνυμο', 'First name / nickname'],
    interests_only: ['Ενδιαφέροντα', 'Interests'],
    trust_badges: ['Σήμα εμπιστοσύνης', 'Trust badge'],
    optional_photo: ['Προαιρετική φωτογραφία', 'Optional photo'],
    mini_profile: ['Μίνι προφίλ', 'Mini profile'],
  };
  const pair = map[exposure];
  return t(pair[0], pair[1]);
}

export function rateLimitOk(
  userId: string,
  requests: CompanyRequest[],
  joinsToday: { userId: string; at: string }[],
  maxRequestsPerDay: number,
  maxJoinsPerHour: number,
): { ok: boolean; reasonEl: string; reasonEn: string } {
  const dayAgo = Date.now() - 86400000;
  const hourAgo = Date.now() - 3600000;
  const myRequestsToday = requests.filter(
    (r) => r.creatorUserId === userId && new Date(r.createdAt).getTime() > dayAgo,
  ).length;
  if (myRequestsToday >= maxRequestsPerDay) {
    return {
      ok: false,
      reasonEl: 'Έφτασες το ημερήσιο όριο αιτημάτων.',
      reasonEn: 'Daily request limit reached.',
    };
  }
  const myJoinsHour = joinsToday.filter(
    (j) => j.userId === userId && new Date(j.at).getTime() > hourAgo,
  ).length;
  if (myJoinsHour >= maxJoinsPerHour) {
    return {
      ok: false,
      reasonEl: 'Περίμενε λίγο πριν στείλεις άλλο αίτημα σύνδεσης.',
      reasonEn: 'Please wait before sending another join request.',
    };
  }
  return { ok: true, reasonEl: '', reasonEn: '' };
}
