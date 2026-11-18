import type { Audience } from './wall';
import type {
  CheckInRecord,
  GroupGenderMode,
  HikeRoute,
  SeatTransfer,
  TicketReservation,
  VibeProfile,
} from './outings';

export type TrustTier = '1_explorer' | '2_confirmed' | '3_high_trust';
export type SafetyLevel = 'low' | 'medium' | 'high_trust';

export interface User {
  id: string;
  name: string; // usually first name or alias
  ageRange: string;
  gender?: string;
  city: string;
  interests: string[];
  trustTier: TrustTier;
  reliabilityScore: number; // hidden internally, determines badge
  badges: string[];
  photoUrl?: string; // photo optional
  bio?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  paymentVerified: boolean;
  idVerified: boolean;
  isOrganizer: boolean;
  /** Platform moderator. Only trusted seed data sets this (see lib/roles.ts). */
  isAdmin?: boolean;
  connections?: string[];
  /** Account privacy projection — denormalized so peers can enforce ACL in-app. */
  privacy?: {
    profileVisibility: 'public' | 'connections' | 'private';
    messagePermission: 'everyone' | 'connections' | 'groups';
    shareLocation: boolean;
    revealPhoto: boolean;
    allowMutualPing: boolean;
    allowOrganizerMsg: boolean;
    /**
     * Φ26 — fine-grained "who can see my profile" (specific people, lists,
     * "…except"). `profileVisibility` stays the coarse, always-present value.
     */
    profileAudience?: Audience;
  };
  /** Users this account has blocked (denormalized for peer ACL checks). */
  blockedUserIds?: string[];
  /** Φ27 — passed the selfie check (Bumble BFF-style middle step). */
  selfieVerified?: boolean;
  /**
   * Φ27 — how each verification was done and when. Only the result is kept,
   * never document data (also for a future Gov.gr Wallet check).
   */
  verifiedVia?: Partial<Record<'email' | 'phone' | 'document' | 'selfie' | 'govgr_wallet', string>>;
  /** Φ27 — optional «στυλ παρέας» answers that refine group matching. */
  vibe?: VibeProfile;
  /** Saved from OnboardingClassic (group size, schedule, location, activity). */
  discoveryPrefs?: {
    groupSize?: string;
    activityLevel?: string;
    schedule?: string[];
    locationPref?: string;
  };
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'reminder' | 'message' | 'system';
}

export interface Event {
  id: string;
  title: string;
  category: string;
  tags?: string[];
  description: string;
  date: string;
  time: string;
  timeZone?: string;
  duration: string;
  locationArea: string; // General area, e.g., "Gazi, Athens"
  exactLocation?: string; // Revealed only to confirmed participants
  isPaid: boolean;
  price: number;
  lat?: number;
  lng?: number;
  groupDiscount?: { minSize: number, percentage: number };
  organizerId: string;
  safetyLevel: SafetyLevel;
  minTrustTierAccess: TrustTier;
  maxParticipants: number;
  currentParticipants?: number;
  isTrending?: boolean;
  imageUrl?: string;
  externalLink?: string;
  /** Platform-curated/advertised event with no group organizer yet.
   *  Any member can step up to host a group for it. */
  isPlatformEvent?: boolean;
  /** Lifecycle status set by the organizer dashboard (Φ20.1); absent = active. */
  status?: 'active' | 'cancelled' | 'archived';
  /** Φ27 — `mini_outing`: coffee / run / walk created by a member, no organizer event behind it. */
  kind?: 'event' | 'mini_outing';
  /** Φ27 — our own small-group nights (Fever Candlelight, adapted). */
  series?: 'nakamas_nights';
  /** Φ27 — hiking route (distance, climb, start point revealed on confirmation). */
  route?: HikeRoute;
}

export interface MemberLocation {
  lat: number;
  lng: number;
  timestamp: number;
  sos?: boolean;
}

export interface Group {
  id: string;
  eventId: string;
  hostId?: string; // optional, can be system-created
  members: string[]; // User IDs
  pendingMembers: string[]; // User IDs that applied/paid and wait for completion
  targetSize: number; // e.g. 4
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  discountUnlocked: boolean;
  meetingPoint?: string; // Revealed upon confirmation
  isLiveTrackingActive?: boolean;
  membersLocations?: Record<string, MemberLocation>;
  /** Host marked group as openly recruiting more members (buddy matching). */
  isRecruiting?: boolean;
  recruitingNote?: string;
  /** Latest organizer announcement (Φ20.1). */
  lastAnnouncement?: { textEl: string; textEn: string; at: string };
  /** Φ27 — «μεικτή» or «γυναίκες & μη δυαδικά άτομα». */
  genderMode?: GroupGenderMode;
  /** Φ27 — people waiting for a seat; the first one takes a seat someone gives up. */
  waitlist?: string[];
  /** Φ27 — the group's discount code (shown to members once the discount unlocks). */
  code?: string;
  /** Φ27 — meet at a partner place before the event (revealed on confirmation). */
  preMeet?: { venueId: string; minutesBefore: number };
  /** Φ27 — arrivals confirmed at the door, by userId. */
  checkIns?: Record<string, CheckInRecord>;
  /** Φ27 — set when the host closes check-in; absences become no-shows then. */
  checkInClosedAt?: string;
  /** Φ27 — the latest seat handed over through the waitlist. */
  lastTransfer?: SeatTransfer;
  /** Φ27 — seats bought together, each member paying their share. */
  tickets?: TicketReservation;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  status: 'active' | 'cancelled' | 'used' | 'refunded';
  pricePaid: number;
}
