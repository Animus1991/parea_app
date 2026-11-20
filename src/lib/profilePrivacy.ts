/**
 * Lean account privacy ACL (profile + DM + photo) — mirrors BuddySeek’s
 * canViewerSeeRequest pattern but for the connection / same-event-group graph.
 * Φ26: the profile gate also honours the fine-grained `profileAudience`
 * (specific people, lists, "…except") shared with the wall (lib/audience.ts).
 */
import type { Group, User } from '../types';
import type { Audience, AudienceList } from '../types/wall';
import { audienceToProfileVisibility, canViewAudience, normalizeAudience } from './audience';

export type ProfileVisibility = 'public' | 'connections' | 'private';
export type MessagePermission = 'everyone' | 'connections' | 'groups';

export interface AccountPrivacy {
  profileVisibility: ProfileVisibility;
  messagePermission: MessagePermission;
  shareLocation: boolean;
  revealPhoto: boolean;
  allowMutualPing: boolean;
  allowOrganizerMsg: boolean;
  /** Fine-grained profile audience (optional; see resolveProfileAudience). */
  profileAudience?: Audience;
}

/** Context the ACL helpers accept. `users` + `lists` enable fine-grained audiences. */
export interface PrivacyCtx {
  blockedUserIds?: string[];
  groups?: Pick<Group, 'members' | 'hostId' | 'status'>[];
  users?: Pick<User, 'id' | 'connections' | 'blockedUserIds'>[];
  lists?: AudienceList[];
}

/**
 * The fine-grained audience applies only while it agrees with the coarse
 * `profileVisibility` (any path that changes the coarse value — the AI,
 * Firestore, an older client — therefore wins and nothing gets stuck).
 */
export function resolveProfileAudience(privacy: AccountPrivacy): Audience | null {
  const a = privacy.profileAudience;
  if (!a) return null;
  const norm = normalizeAudience(a);
  return audienceToProfileVisibility(norm) === privacy.profileVisibility ? norm : null;
}

export const DEFAULT_ACCOUNT_PRIVACY: AccountPrivacy = {
  profileVisibility: 'public',
  messagePermission: 'everyone',
  shareLocation: true,
  revealPhoto: true,
  allowMutualPing: true,
  allowOrganizerMsg: true,
};

export type ProfileAccessLevel = 'full' | 'limited' | 'hidden';

export function resolveAccountPrivacy(user: User | null | undefined): AccountPrivacy {
  return {
    ...DEFAULT_ACCOUNT_PRIVACY,
    ...(user?.privacy ?? {}),
  };
}

export function areConnected(a: User | null | undefined, b: User | null | undefined): boolean {
  if (!a?.id || !b?.id || a.id === b.id) return false;
  const aHas = (a.connections ?? []).includes(b.id);
  const bHas = (b.connections ?? []).includes(a.id);
  return aHas || bHas;
}

/** True when both users share an active (or pending) event group as member/host. */
export function shareEventGroup(
  aId: string,
  bId: string,
  groups: Pick<Group, 'members' | 'hostId' | 'status'>[],
): boolean {
  if (!aId || !bId || aId === bId) return false;
  return groups.some((g) => {
    if (g.status === 'cancelled') return false;
    const inA = g.members.includes(aId) || g.hostId === aId;
    const inB = g.members.includes(bId) || g.hostId === bId;
    return inA && inB;
  });
}

export function isBlockedBetween(
  viewer: User | null | undefined,
  subject: User | null | undefined,
  viewerBlockedIds: string[] = [],
): boolean {
  if (!viewer?.id || !subject?.id || viewer.id === subject.id) return false;
  if (viewerBlockedIds.includes(subject.id)) return true;
  if ((viewer.blockedUserIds ?? []).includes(subject.id)) return true;
  if ((subject.blockedUserIds ?? []).includes(viewer.id)) return true;
  return false;
}

export function canViewerSeeProfile(
  viewer: User | null | undefined,
  subject: User | null | undefined,
  ctx?: PrivacyCtx,
): { allowed: boolean; level: ProfileAccessLevel; reasonEl: string; reasonEn: string } {
  if (!subject) {
    return {
      allowed: false,
      level: 'hidden',
      reasonEl: 'Ο χρήστης δεν βρέθηκε',
      reasonEn: 'User not found',
    };
  }
  if (viewer?.id === subject.id) {
    return { allowed: true, level: 'full', reasonEl: '', reasonEn: '' };
  }
  if (isBlockedBetween(viewer, subject, ctx?.blockedUserIds)) {
    return {
      allowed: false,
      level: 'hidden',
      reasonEl: 'Αυτό το προφίλ δεν είναι διαθέσιμο',
      reasonEn: 'This profile is unavailable',
    };
  }

  const privacy = resolveAccountPrivacy(subject);
  const fine = resolveProfileAudience(privacy);
  if (fine && ctx?.users && viewer?.id) {
    const graph = {
      users: ctx.users.some((u) => u.id === viewer.id) ? ctx.users : [...ctx.users, viewer],
      lists: ctx.lists ?? [],
      viewerBlockedIds: ctx.blockedUserIds,
    };
    if (canViewAudience(subject.id, viewer.id, fine, graph)) {
      return { allowed: true, level: 'full', reasonEl: '', reasonEn: '' };
    }
    if (subject.isOrganizer) {
      return {
        allowed: true,
        level: 'limited',
        reasonEl: 'Το πλήρες προφίλ είναι ορατό μόνο σε επιλεγμένα άτομα',
        reasonEn: 'Full profile is visible to selected people only',
      };
    }
    return {
      allowed: false,
      level: 'hidden',
      reasonEl:
        fine.base === 'only_me' ? 'Αυτό το προφίλ είναι ιδιωτικό' : 'Το προφίλ είναι ορατό μόνο σε επιλεγμένα άτομα',
      reasonEn: fine.base === 'only_me' ? 'This profile is private' : 'This profile is visible to selected people only',
    };
  }
  if (privacy.profileVisibility === 'public') {
    return { allowed: true, level: 'full', reasonEl: '', reasonEn: '' };
  }
  if (privacy.profileVisibility === 'private') {
    // Organizers still show a limited public card (name + hosted events) so event
    // discovery keeps working; full bio/photo/contact stay gated.
    if (subject.isOrganizer) {
      return {
        allowed: true,
        level: 'limited',
        reasonEl: 'Το πλήρες προφίλ είναι ιδιωτικό',
        reasonEn: 'Full profile is private',
      };
    }
    return {
      allowed: false,
      level: 'hidden',
      reasonEl: 'Αυτό το προφίλ είναι ιδιωτικό',
      reasonEn: 'This profile is private',
    };
  }
  // connections
  if (areConnected(viewer, subject)) {
    return { allowed: true, level: 'full', reasonEl: '', reasonEn: '' };
  }
  if (subject.isOrganizer) {
    return {
      allowed: true,
      level: 'limited',
      reasonEl: 'Πλήρες προφίλ μόνο για συνδέσεις Nakamas',
      reasonEn: 'Full profile only for Nakamas connections',
    };
  }
  return {
    allowed: false,
    level: 'hidden',
    reasonEl: 'Το προφίλ είναι ορατό μόνο σε συνδέσεις Nakamas',
    reasonEn: 'Profile is visible only to Nakamas connections',
  };
}

export function shouldShowProfilePhoto(
  viewer: User | null | undefined,
  subject: User | null | undefined,
  ctx?: PrivacyCtx,
): boolean {
  const access = canViewerSeeProfile(viewer, subject, ctx);
  if (!access.allowed || access.level === 'hidden') return false;
  if (viewer?.id === subject?.id) return true;
  if (access.level === 'limited') return false;
  const privacy = resolveAccountPrivacy(subject);
  // revealPhoto: when false, hide photo from non-connections (lean interpretation).
  if (!privacy.revealPhoto && !areConnected(viewer, subject)) return false;
  return Boolean(subject?.photoUrl);
}

export function canViewerMessageUser(
  viewer: User | null | undefined,
  subject: User | null | undefined,
  ctx?: PrivacyCtx,
): { allowed: boolean; reasonEl: string; reasonEn: string } {
  if (!viewer) {
    return { allowed: false, reasonEl: 'Σύνδεση απαιτείται', reasonEn: 'Sign in required' };
  }
  if (!subject) {
    return { allowed: false, reasonEl: 'Ο χρήστης δεν βρέθηκε', reasonEn: 'User not found' };
  }
  if (viewer.id === subject.id) {
    return { allowed: false, reasonEl: 'Δεν μπορείς να στείλεις μήνυμα στον εαυτό σου', reasonEn: 'You cannot message yourself' };
  }
  if (isBlockedBetween(viewer, subject, ctx?.blockedUserIds)) {
    return { allowed: false, reasonEl: 'Αποκλεισμένη επαφή', reasonEn: 'Blocked contact' };
  }

  const privacy = resolveAccountPrivacy(subject);
  if (privacy.messagePermission === 'everyone') {
    return { allowed: true, reasonEl: '', reasonEn: '' };
  }
  if (privacy.messagePermission === 'connections') {
    if (areConnected(viewer, subject)) return { allowed: true, reasonEl: '', reasonEn: '' };
    return {
      allowed: false,
      reasonEl: 'Μηνύματα μόνο από συνδέσεις Nakamas',
      reasonEn: 'Messages only from Nakamas connections',
    };
  }
  // groups — same event group co-membership
  if (shareEventGroup(viewer.id, subject.id, ctx?.groups ?? [])) {
    return { allowed: true, reasonEl: '', reasonEn: '' };
  }
  return {
    allowed: false,
    reasonEl: 'Μηνύματα μόνο από μέλη κοινής ομάδας εκδήλωσης',
    reasonEn: 'Messages only from shared event group members',
  };
}

/** Organizer contact form — subject must allow organizer msgs + messagePermission. */
export function canViewerContactOrganizer(
  viewer: User | null | undefined,
  subject: User | null | undefined,
  ctx?: PrivacyCtx,
): { allowed: boolean; reasonEl: string; reasonEn: string } {
  if (!subject?.isOrganizer) {
    return { allowed: false, reasonEl: 'Δεν είναι διοργανωτής', reasonEn: 'Not an organizer' };
  }
  const privacy = resolveAccountPrivacy(subject);
  if (!privacy.allowOrganizerMsg) {
    return {
      allowed: false,
      reasonEl: 'Ο διοργανωτής δεν δέχεται μηνύματα επαφής',
      reasonEn: 'This organizer is not accepting contact messages',
    };
  }
  return canViewerMessageUser(viewer, subject, ctx);
}

export function projectProfileForViewer(
  viewer: User | null | undefined,
  subject: User,
  ctx?: PrivacyCtx,
): {
  access: ReturnType<typeof canViewerSeeProfile>;
  name: string;
  city?: string;
  bio?: string;
  photoUrl?: string;
  interests?: string[];
  showContact: boolean;
} {
  const access = canViewerSeeProfile(viewer, subject, ctx);
  if (!access.allowed || access.level === 'hidden') {
    return {
      access,
      name: subject.isOrganizer ? subject.name : tHiddenName(),
      showContact: false,
    };
  }
  if (access.level === 'limited') {
    return {
      access,
      name: subject.name,
      city: subject.city,
      bio: undefined,
      photoUrl: undefined,
      interests: undefined,
      showContact: false,
    };
  }
  const showPhoto = shouldShowProfilePhoto(viewer, subject, ctx);
  const msg = canViewerContactOrganizer(viewer, subject, ctx);
  return {
    access,
    name: subject.name,
    city: subject.city,
    bio: subject.bio,
    photoUrl: showPhoto ? subject.photoUrl : undefined,
    interests: subject.interests,
    showContact: Boolean(subject.isOrganizer && msg.allowed),
  };
}

function tHiddenName() {
  return 'Nakamas member';
}

export function profileVisibilityLabel(v: ProfileVisibility): { el: string; en: string } {
  switch (v) {
    case 'connections':
      return { el: 'Μόνο συνδέσεις Nakamas', en: 'Connections only' };
    case 'private':
      return { el: 'Ιδιωτικό', en: 'Private' };
    default:
      return { el: 'Δημόσιο', en: 'Public' };
  }
}

export function messagePermissionLabel(v: MessagePermission): { el: string; en: string } {
  switch (v) {
    case 'connections':
      return { el: 'Μόνο συνδέσεις Nakamas', en: 'Connections only' };
    case 'groups':
      return { el: 'Ομάδες ίδιας εκδήλωσης', en: 'Same event groups' };
    default:
      return { el: 'Όλοι', en: 'Everyone' };
  }
}
