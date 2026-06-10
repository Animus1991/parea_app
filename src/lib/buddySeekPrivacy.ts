import { canViewerSeeRequest } from './companyRequestUtils';
import type { BuddySeekIntent, BuddySeekPreferences } from '../types/buddySeek';
import type { CompanyRequest } from '../types/companyRequest';
import type { Event, Group, User } from '../types';

function isCompanyRequest(intent: BuddySeekIntent | CompanyRequest): intent is CompanyRequest {
  return 'creatorUserId' in intent;
}

export function canViewerSeeBuddySeek(
  viewer: User | null,
  seeker: User,
  intent: BuddySeekIntent | CompanyRequest,
  event: Event,
  opts?: { viewerAlsoSeekingSameEvent?: boolean; groups?: Group[] },
): boolean {
  if (!viewer) return false;
  if (viewer.id === seeker.id) return true;

  if (isCompanyRequest(intent)) {
    return canViewerSeeRequest(viewer, intent, seeker, event, {
      groups: opts?.groups ?? [],
      viewerViewingEventId: event.id,
      viewerAlsoSeekingEvent: opts?.viewerAlsoSeekingSameEvent,
    });
  }

  if (intent.status !== 'active') return false;
  if (intent.visibility === 'hidden') return false;
  if (intent.visibility === 'all_logged_in') return true;
  if (opts?.viewerAlsoSeekingSameEvent) return true;
  const tags = new Set((event.tags ?? []).map((t) => t.toLowerCase()));
  const pool = [...(viewer.interests ?? []), ...tags];
  const shared = (seeker.interests ?? []).filter((i) =>
    pool.some((p) => p.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(p.toLowerCase())),
  ).length;
  return shared > 0;
}

export function shouldShowBuddySeekPhoto(
  viewer: User | null,
  seeker: User,
  prefs: BuddySeekPreferences,
  intent: BuddySeekIntent | CompanyRequest,
  event: Event,
  viewerAlsoSeeking: boolean,
): boolean {
  if (!prefs.showPhotoInDiscovery) return false;
  return canViewerSeeBuddySeek(viewer, seeker, intent, event, {
    viewerAlsoSeekingSameEvent: viewerAlsoSeeking,
  });
}

export function visibilityLabel(
  visibility: BuddySeekIntent['visibility'] | CompanyRequest['visibilityMode'],
): { el: string; en: string } {
  if (typeof visibility === 'string' && visibility.includes('_')) {
    const map: Record<string, { el: string; en: string }> = {
      private: { el: 'Ιδιωτικό', en: 'Private' },
      similar_interests: { el: 'Κοινά ενδιαφέροντα', en: 'Similar interests' },
      same_event_viewers: { el: 'Ίδια εκδήλωση', en: 'Same event viewers' },
      verified_users: { el: 'Επαληθευμένοι', en: 'Verified users' },
      public_event_page: { el: 'Σελίδα εκδήλωσης', en: 'Event page' },
    };
    return map[visibility] ?? map.similar_interests;
  }
  switch (visibility) {
    case 'hidden':
      return { el: 'Κρυφό', en: 'Hidden' };
    case 'all_logged_in':
      return { el: 'Όλοι οι συνδεδεμένοι', en: 'All logged-in users' };
    default:
      return { el: 'Με κοινά ενδιαφέροντα', en: 'Similar interests only' };
  }
}
