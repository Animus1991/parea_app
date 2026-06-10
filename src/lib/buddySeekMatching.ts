import { computeMatchScore } from './matching';
import { canViewerSeeBuddySeek } from './buddySeekPrivacy';
import type { BuddySeekMatchSuggestion } from '../types/buddySeek';
import type { CompanyRequest } from '../types/companyRequest';

function requestUserId(r: CompanyRequest): string {
  return r.creatorUserId;
}
import type { Event, Group, User } from '../types';

export function getActiveBuddySeeksForEvent(
  intents: CompanyRequest[],
  eventId: string,
  excludeUserId?: string,
): CompanyRequest[] {
  return intents.filter(
    (i) =>
      i.eventId === eventId &&
      i.status === 'active' &&
      (!excludeUserId || requestUserId(i) !== excludeUserId),
  );
}

export function buildBuddySeekSuggestions(
  viewer: User | null,
  event: Event,
  intents: CompanyRequest[],
  groups: Group[],
  users: User[],
): BuddySeekMatchSuggestion[] {
  if (!viewer) return [];

  const out: BuddySeekMatchSuggestion[] = [];
  const active = getActiveBuddySeeksForEvent(intents, event.id, viewer.id);
  const viewerAlsoSeeking = intents.some(
    (i) => requestUserId(i) === viewer.id && i.eventId === event.id && i.status === 'active',
  );

  for (const intent of active) {
    const seeker = users.find((u) => u.id === requestUserId(intent));
    if (!seeker) continue;
    if (!canViewerSeeBuddySeek(viewer, seeker, intent, event, { viewerAlsoSeekingSameEvent: viewerAlsoSeeking }))
      continue;

    const score = computeMatchScore(viewer, event) + sharedInterestBonus(viewer, seeker, event);
    out.push({
      kind: 'person_person',
      score,
      eventId: event.id,
      seekerUserId: seeker.id,
      seekerIntentId: intent.id,
      labelEl: `${seeker.name} ψάχνει παρέα για αυτή την εκδήλωση`,
      labelEn: `${seeker.name} is looking for company for this event`,
    });
  }

  const openGroups = groups.filter(
    (g) =>
      g.eventId === event.id &&
      g.status !== 'cancelled' &&
      g.members.length < g.targetSize &&
      (g.isRecruiting || g.members.length > 0),
  );

  for (const g of openGroups) {
    if (g.members.includes(viewer.id)) continue;
    const hostId = g.hostId ?? g.members[0];
    const host = users.find((u) => u.id === hostId);
    const spots = g.targetSize - g.members.length;
    out.push({
      kind: 'person_group',
      score: 70 + spots * 3,
      eventId: event.id,
      groupId: g.id,
      seekerUserId: hostId,
      labelEl: g.isRecruiting
        ? `Ομάδα ${spots} θέσεων — δέχεται νέα μέλη`
        : `Ομάδα με ${spots} ελεύθερες θέσεις`,
      labelEn: g.isRecruiting
        ? `Group with ${spots} spots — welcoming new members`
        : `Group with ${spots} open spots`,
    });
  }

  const myGroups = groups.filter(
    (g) => g.eventId === event.id && g.hostId === viewer.id && g.members.length < g.targetSize,
  );
  for (const intent of active) {
    if (intent.lookingForType === 'join_group') continue;
    for (const g of myGroups) {
      out.push({
        kind: 'group_person',
        score: 65,
        eventId: event.id,
        groupId: g.id,
        seekerUserId: requestUserId(intent),
        seekerIntentId: intent.id,
        labelEl: `Πρόσκληση σε ομάδα — ψάχνει παρέα`,
        labelEn: `Invite to your group — seeking company`,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

function sharedInterestBonus(viewer: User, seeker: User, event: Event): number {
  const tags = event.tags ?? [];
  const overlap = (seeker.interests ?? []).filter((i) =>
    (viewer.interests ?? []).some(
      (vi) => vi.toLowerCase() === i.toLowerCase() || tags.some((t) => t.toLowerCase() === i.toLowerCase()),
    ),
  ).length;
  return overlap * 8;
}

export function discoveryScoreForSeeker(
  viewer: User | null,
  seeker: User,
  event: Event,
  intent: CompanyRequest,
): number {
  if (!viewer) return 0;
  return computeMatchScore(viewer, event) + sharedInterestBonus(viewer, seeker, event);
}
