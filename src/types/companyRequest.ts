import type { TrustTier } from './index';

export type LookingForType =
  | 'join_group'
  | 'find_people'
  | 'create_group'
  | 'group_merge'
  | 'open_to_suggestions';

export type VisibilityMode =
  | 'private'
  | 'similar_interests'
  | 'same_event_viewers'
  | 'verified_users'
  | 'existing_groups'
  | 'organizer_only'
  | 'public_event_page';

export type ProfileExposure =
  | 'anonymous'
  | 'nickname'
  | 'interests_only'
  | 'trust_badges'
  | 'optional_photo'
  | 'mini_profile';

export type CompanyRequestStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'matched'
  | 'expired'
  | 'completed'
  | 'cancelled'
  | 'deleted';

export type MeetingPreference =
  | 'at_venue'
  | 'coffee_before'
  | 'walk_after'
  | 'chat_first';

export type InterestVisibilityMode = 'all' | 'shared_only' | 'count_only' | 'hidden';

export type PhotoRevealPolicy =
  | 'never'
  | 'after_accept'
  | 'confirmed_group_only'
  | 'in_cards_opt_in';

export interface CompanyRequest {
  id: string;
  eventId: string;
  creatorUserId: string;
  lookingForType: LookingForType;
  message?: string;
  preferredGroupMin?: number;
  preferredGroupMax?: number;
  flexibleDates?: boolean;
  preferredDateTime?: string;
  meetingPreference: MeetingPreference;
  visibilityMode: VisibilityMode;
  profileExposure: ProfileExposure;
  requiredTrustTier: TrustTier | 'none';
  status: CompanyRequestStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  matchedGroupId?: string;
  reportCountInternal?: number;
  /** @deprecated legacy */
  openToJoinGroup?: boolean;
}

export type CompanyJoinRequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

export interface CompanyJoinRequest {
  id: string;
  companyRequestId: string;
  fromUserId: string;
  fromGroupId?: string;
  targetUserId?: string;
  targetGroupId?: string;
  message?: string;
  status: CompanyJoinRequestStatus;
  createdAt: string;
  chatUnlocked?: boolean;
  coordinationGroupId?: string;
}

export type GroupMergeMode = 'coordinate' | 'merge' | 'meet_before' | 'share_chat';

export interface GroupMergeSuggestion {
  id: string;
  eventId: string;
  fromGroupId: string;
  toGroupId: string;
  fromUserId: string;
  message?: string;
  mode: GroupMergeMode;
  status: CompanyJoinRequestStatus;
  createdAt: string;
}

export interface CompanyRequestPreferences {
  defaultVisibility: VisibilityMode;
  defaultProfileExposure: ProfileExposure;
  photoRevealPolicy: PhotoRevealPolicy;
  interestVisibility: InterestVisibilityMode;
  showPhotoInDiscovery: boolean;
  showInterestsInDiscovery: boolean;
  allowMessagesFromMatchers: boolean;
  allowSimilarInterestRecommendations: boolean;
  allowSameEventSuggestions: boolean;
  allowGroupInvites: boolean;
  allowGroupMergeSuggestions: boolean;
}

export const DEFAULT_COMPANY_REQUEST_PREFS: CompanyRequestPreferences = {
  defaultVisibility: 'similar_interests',
  defaultProfileExposure: 'interests_only',
  photoRevealPolicy: 'after_accept',
  interestVisibility: 'shared_only',
  showPhotoInDiscovery: false,
  showInterestsInDiscovery: true,
  allowMessagesFromMatchers: true,
  allowSimilarInterestRecommendations: true,
  allowSameEventSuggestions: true,
  allowGroupInvites: true,
  allowGroupMergeSuggestions: true,
};

export type CompanyRequestReportReason =
  | 'inappropriate_message'
  | 'dating_intent'
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'misleading'
  | 'unsafe'
  | 'suspicious'
  | 'other';

export interface CompanyRequestReport {
  id: string;
  requestId: string;
  reporterUserId: string;
  reason: CompanyRequestReportReason;
  createdAt: string;
}
