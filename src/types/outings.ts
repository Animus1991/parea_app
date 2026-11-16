/**
 * Outings (Φ27) — the plan from the competitive analysis, as data.
 * Each type notes the idea it carries and where it came from.
 */

/** Group composition rule (Timeleft-style comfort option). */
export type GroupGenderMode = 'mixed' | 'women_nb';

/** Self-declared, optional, used only for women & non-binary groups. */
export type GenderIdentity = 'woman' | 'man' | 'non_binary' | 'undisclosed';

/** «Το στυλ παρέας μου» — 5 optional answers (Timeleft / Pie quizzes, adapted). */
export interface VibeProfile {
  /** 1 χαλαρά · 2 ενδιάμεσα · 3 έντονα */
  pace: 1 | 2 | 3;
  /** 1 ήσυχα μέρη · 2 ό,τι να 'ναι · 3 ζωηρά μέρη */
  noise: 1 | 2 | 3;
  /** 1 ακούω περισσότερο · 2 ισορροπία · 3 μιλάω περισσότερο */
  talk: 1 | 2 | 3;
  /** 1 € · 2 €€ · 3 €€€ */
  budget: 1 | 2 | 3;
  lang: 'el' | 'en' | 'both';
  answeredAt: string;
}

/** Proof of attendance, written by the host / organizer at the door. */
export interface CheckInRecord {
  at: string;
  /** Who confirmed the arrival. */
  by: string;
  method: 'qr' | 'code' | 'manual';
}

export type StrikeKind = 'no_show' | 'late_cancel' | 'report_upheld';

/** Graduated consequences (Timeleft moderation, adapted to reliability). */
export interface Strike {
  id: string;
  userId: string;
  kind: StrikeKind;
  at: string;
  groupId?: string;
  eventId?: string;
  /** Reliability points taken (restored if an appeal is upheld for the member). */
  reliabilityDelta: number;
  appeal?: {
    text: string;
    at: string;
    status: 'pending' | 'accepted' | 'rejected';
    decidedAt?: string;
    decidedBy?: string;
  };
}

/** Friend invitation to a group outing; friends answer without an account (Partiful). */
export interface PlanInvite {
  id: string;
  groupId: string;
  eventId: string;
  hostId: string;
  coverId: string;
  createdAt: string;
  responses: InviteResponse[];
}

export interface InviteResponse {
  id: string;
  name: string;
  status: 'going' | 'maybe' | 'no';
  at: string;
}

/** Hiking route shown on the event page (Meetup × komoot, adapted). */
export interface HikeRoute {
  distanceKm: number;
  elevationGainM: number;
  durationH: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  /** Shown to everyone. */
  startArea: string;
  /** Revealed to confirmed members only. */
  startPoint: string;
  /** Simplified elevation profile in metres, for the mini chart. */
  profileM?: number[];
}

/** Partner place for «Συνάντηση πριν» (Loft, adapted). */
export interface PartnerVenue {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  /** Group discount the venue gives Nakamas groups. */
  discountPct: number;
  kind: 'cafe' | 'bar' | 'wine_bar';
}

/** Group seats bought together, each member paying their own share (more.com, adapted). */
export interface TicketReservation {
  id: string;
  provider: string;
  status: 'awaiting_payments' | 'issued' | 'cancelled';
  unitPrice: number;
  createdAt: string;
  payments: Record<string, 'pending' | 'paid'>;
}

/** Seat handed to the next person on the group waitlist, at face value (DICE, adapted). */
export interface SeatTransfer {
  fromUserId: string;
  toUserId: string;
  at: string;
  price: number;
}
