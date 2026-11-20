import type { Event, TrustTier, User } from '../types';

const TIER_RANK: Record<TrustTier, number> = {
  '1_explorer': 1,
  '2_confirmed': 2,
  '3_high_trust': 3,
};

export interface TrustGateResult {
  allowed: boolean;
  reason?: 'tier' | 'feedback' | 'commitment';
  messageEl: string;
  messageEn: string;
}

export function tierRank(tier: TrustTier): number {
  return TIER_RANK[tier] ?? 1;
}

export function canAccessEvent(user: User | null, event: Event): TrustGateResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'tier',
      messageEl: 'Συνδέσου για να συμμετάσχεις.',
      messageEn: 'Sign in to join this experience.',
    };
  }
  if (tierRank(user.trustTier) < tierRank(event.minTrustTierAccess)) {
    const needsId = event.minTrustTierAccess === '3_high_trust';
    return {
      allowed: false,
      reason: 'tier',
      messageEl: needsId
        ? 'Αυτή η έξοδος είναι για διοργάνωση και επιβεβαιωμένα μέλη. Ολοκλήρωσε email και τηλέφωνο· η ταυτότητα ζητείται μόνο τότε.'
        : 'Επιβεβαίωσε email και τηλέφωνο για να μπεις σε αυτή την ομάδα.',
      messageEn: needsId
        ? 'This outing is for hosting and confirmed members. Finish email and phone first; ID is only asked then.'
        : 'Confirm email and phone to join this group.',
    };
  }
  return { allowed: true, messageEl: '', messageEn: '' };
}

export function tierLabelEl(tier: TrustTier): string {
  switch (tier) {
    case '3_high_trust':
      return 'Υψηλής Εμπιστοσύνης';
    case '2_confirmed':
      return 'Επιβεβαιωμένο';
    default:
      return 'Εξερευνητή';
  }
}

export function tierLabelEn(tier: TrustTier): string {
  switch (tier) {
    case '3_high_trust':
      return 'High Trust';
    case '2_confirmed':
      return 'Confirmed';
    default:
      return 'Explorer';
  }
}

export function reliabilityBadge(score: number): { el: string; en: string } {
  if (score >= 95) return { el: 'Εξαιρετικά Αξιόπιστος', en: 'Highly Reliable' };
  if (score >= 85) return { el: 'Συχνός Συμμετέχων', en: 'Frequent Participant' };
  if (score >= 70) return { el: 'Ενεργό Μέλος', en: 'Active Member' };
  return { el: 'Νέο Μέλος', en: 'New Member' };
}

export function computeReliabilityDelta(feedback: {
  overallRating: number;
  attendance?: string;
}): number {
  let delta = 0;
  if (feedback.overallRating >= 4) delta += 2;
  if (feedback.attendance === 'yes') delta += 3;
  if (feedback.attendance === 'no_show') delta -= 15;
  if (feedback.attendance === 'late_cancel') delta -= 8;
  return delta;
}
