import type { CompanyRequest, VisibilityMode } from './companyRequest';

/** @deprecated use VisibilityMode */
export type BuddySeekVisibility = 'hidden' | 'similar_interests' | 'all_logged_in';

/** User declares interest in an event but needs company to attend. */
export type BuddySeekMatchPreference = 'any' | 'individuals' | 'groups';

/** Legacy shape; store uses CompanyRequest with creatorUserId */
export interface BuddySeekIntent {
  id: string;
  userId: string;
  eventId: string;
  message?: string;
  matchPreference: BuddySeekMatchPreference;
  openToJoinGroup: boolean;
  visibility: BuddySeekVisibility;
  status: 'active' | 'paused' | 'fulfilled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export function intentToLegacy(intent: CompanyRequest): BuddySeekIntent {
  const visibility: BuddySeekVisibility =
    intent.visibilityMode === 'private'
      ? 'hidden'
      : intent.visibilityMode === 'public_event_page'
        ? 'all_logged_in'
        : 'similar_interests';
  const matchPreference: BuddySeekMatchPreference =
    intent.lookingForType === 'find_people'
      ? 'individuals'
      : intent.lookingForType === 'join_group'
        ? 'groups'
        : 'any';
  const status =
    intent.status === 'active' || intent.status === 'paused'
      ? intent.status
      : intent.status === 'matched' || intent.status === 'completed'
        ? 'fulfilled'
        : 'cancelled';
  return {
    id: intent.id,
    userId: intent.creatorUserId,
    eventId: intent.eventId,
    message: intent.message,
    matchPreference,
    openToJoinGroup: intent.openToJoinGroup ?? true,
    visibility,
    status,
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
  };
}

export function legacyVisibilityToMode(v: BuddySeekVisibility): VisibilityMode {
  if (v === 'hidden') return 'private';
  if (v === 'all_logged_in') return 'public_event_page';
  return 'similar_interests';
}
export interface BuddySeekPreferences {
  defaultVisibility: BuddySeekVisibility;
  showPhotoInDiscovery: boolean;
  showInterestsInDiscovery: boolean;
  allowMessagesFromMatchers: boolean;
}

export const DEFAULT_BUDDY_SEEK_PREFS: BuddySeekPreferences = {
  defaultVisibility: 'similar_interests',
  showPhotoInDiscovery: true,
  showInterestsInDiscovery: true,
  allowMessagesFromMatchers: true,
};

export type BuddySeekMatchKind =
  | 'person_person'
  | 'person_group'
  | 'group_person'
  | 'group_group';

export interface BuddySeekMatchSuggestion {
  kind: BuddySeekMatchKind;
  score: number;
  eventId: string;
  /** Seeker user id or group host representative */
  seekerUserId?: string;
  seekerIntentId?: string;
  groupId?: string;
  labelEl: string;
  labelEn: string;
}
