import type { Event, Group, TrustTier } from '../types';
import { tierLabelEl, tierLabelEn } from './trust';

export type ComfortLevelLabel = 'public' | 'organized' | 'high_trust' | 'basic';

export type LocationTypeLabel =
  | 'public_venue'
  | 'private_semi'
  | 'online'
  | 'revealed_after_confirmation';

export interface EventQuickInfoModel {
  category: string;
  trustLevelEl: string;
  trustLevelEn: string;
  comfortLevelEl: string;
  comfortLevelEn: string;
  verificationEl: string;
  verificationEn: string;
  costEl: string;
  costEn: string;
  groupStatusEl: string;
  groupStatusEn: string;
  locationTypeEl: string;
  locationTypeEn: string;
  meetingPoint?: string;
}

function categoryBlob(event: Event): string {
  return `${event.category} ${event.title} ${(event.tags ?? []).join(' ')}`.toLowerCase();
}

export function inferComfortLevel(event: Event): ComfortLevelLabel {
  const blob = categoryBlob(event);
  if (/online|zoom|virtual|remote|διαδικτυακ/.test(blob)) return 'basic';
  if (
    /hik|hike|escape|day trip|daytrip|private|late|νυχτεριν|εκδρομ|trek/.test(blob)
  ) {
    return 'high_trust';
  }
  if (
    /board game|café|cafe|social meetup|meetup|παρέα|networking|coffee/.test(blob)
  ) {
    return 'organized';
  }
  if (
    /theatre|theater|cinema|stand-up|standup|museum|concert|exhibition|παράσταση|μουσείο|σινεμ/.test(
      blob,
    )
  ) {
    return 'public';
  }
  if (event.minTrustTierAccess === '3_high_trust') return 'high_trust';
  if (event.minTrustTierAccess === '2_confirmed') return 'organized';
  return 'public';
}

export function inferLocationType(
  event: Event,
  userIsParticipant: boolean,
  meetingPoint?: string,
): LocationTypeLabel {
  const blob = categoryBlob(event);
  if (/online|zoom|virtual|remote|διαδικτυακ/.test(blob)) return 'online';
  if (event.exactLocation || (userIsParticipant && meetingPoint)) return 'public_venue';
  if (event.exactLocation === undefined && !meetingPoint) {
    if (/private|home|studio|αποκλειστ/.test(blob)) return 'private_semi';
    return 'revealed_after_confirmation';
  }
  return 'public_venue';
}

export function buildEventQuickInfo(
  event: Event,
  groups: Group[],
  t: (el: string, en: string) => string,
): EventQuickInfoModel {
  const tier = event.minTrustTierAccess as TrustTier;
  const comfort = inferComfortLevel(event);
  const eventGroups = groups.filter((g) => g.eventId === event.id);
  const totalMembers = eventGroups.reduce((acc, g) => acc + g.members.length, 0);
  const confirmed = eventGroups.filter((g) => g.status === 'confirmed').length;
  const pending = eventGroups.filter((g) => g.status === 'pending').length;

  const comfortLabels: Record<ComfortLevelLabel, [string, string]> = {
    public: ['Δημόσιος χώρος', 'Public'],
    organized: ['Οργανωμένη συνάντηση', 'Organized'],
    high_trust: ['Υψηλής εμπιστοσύνης', 'High-trust'],
    basic: ['Βασικό', 'Basic'],
  };

  const [comfortEl, comfortEn] = comfortLabels[comfort];

  const verificationRequired = tier !== '1_explorer';
  const meetingPoint = eventGroups.find((g) => g.meetingPoint)?.meetingPoint;

  const locationType = inferLocationType(event, false, meetingPoint);
  const locationLabels: Record<LocationTypeLabel, [string, string]> = {
    public_venue: ['Δημόσιος χώρος', 'Public venue'],
    private_semi: ['Ιδιωτικός / ημι-ιδιωτικός χώρος', 'Private / semi-private'],
    online: ['Διαδικτυακά', 'Online'],
    revealed_after_confirmation: [
      'Αποκαλύπτεται μετά την επιβεβαίωση',
      'Revealed after confirmation',
    ],
  };
  const [locEl, locEn] = locationLabels[locationType];

  let groupStatusEl: string;
  let groupStatusEn: string;
  if (eventGroups.length === 0) {
    groupStatusEl = 'Δεν έχουν δημιουργηθεί ομάδες ακόμα';
    groupStatusEn = 'No groups formed yet';
  } else {
    groupStatusEl = `${eventGroups.length} ${eventGroups.length === 1 ? 'ομάδα' : 'ομάδες'} · ${totalMembers} μέλη`;
    groupStatusEn = `${eventGroups.length} group(s) · ${totalMembers} members`;
    if (confirmed > 0 || pending > 0) {
      groupStatusEl += ` · ${confirmed} επιβεβαιωμένες`;
      groupStatusEn += ` · ${confirmed} confirmed`;
    }
  }

  return {
    category: event.category,
    trustLevelEl: tierLabelEl(tier),
    trustLevelEn: tierLabelEn(tier),
    comfortLevelEl: comfortEl,
    comfortLevelEn: comfortEn,
    verificationEl: verificationRequired
      ? t('Απαιτείται επαλήθευση', 'Verification required')
      : t('Χωρίς επιπλέον επαλήθευση', 'No extra verification'),
    verificationEn: verificationRequired ? 'Verification required' : 'No extra verification',
    costEl: event.isPaid ? `€${event.price}` : t('Δωρεάν', 'Free'),
    costEn: event.isPaid ? `€${event.price}` : 'Free',
    groupStatusEl,
    groupStatusEn,
    locationTypeEl: locEl,
    locationTypeEn: locEn,
    meetingPoint,
  };
}
