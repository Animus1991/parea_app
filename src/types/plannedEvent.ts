import type { Event, TrustTier } from './index';

export type PlannedGroupStatus = 'none' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PlannedTicketStatus = 'none' | 'pending' | 'active' | 'used';
export type PlannedUserStatus = 'confirmed' | 'pending' | 'waitlist';

/** Enriched planned event for calendar, stories, and daily schedule views. */
export interface PlannedEvent {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  locationName: string;
  address: string;
  lat?: number;
  lng?: number;
  trustTier: TrustTier;
  verificationRequired: boolean;
  groupStatus: PlannedGroupStatus;
  ticketStatus: PlannedTicketStatus;
  userStatus: PlannedUserStatus;
  meetingPoint?: string;
  groupId?: string;
  /** Raw store event (navigation, ICS, etc.) */
  event: Event;
  parsedDate: Date;
  time: string;
}
