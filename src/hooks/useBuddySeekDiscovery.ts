import { useMemo } from 'react';
import { useStore } from '../store';
import { canViewerSeeBuddySeek } from '../lib/buddySeekPrivacy';
import { discoveryScoreForSeeker } from '../lib/buddySeekMatching';
import type { CompanyRequest } from '../types/companyRequest';
import type { Event, User } from '../types';

export interface BuddySeekDiscoveryItem {
  intent: CompanyRequest;
  seeker: User;
  event: Event;
  score: number;
}

export function useBuddySeekDiscovery(limit = 8): BuddySeekDiscoveryItem[] {
  const currentUser = useStore((s) => s.currentUser);
  const intents = useStore((s) => s.companyRequests);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);

  return useMemo(() => {
    if (!currentUser) return [];

    const viewerEventIds = new Set(
      intents
        .filter((i) => i.creatorUserId === currentUser.id && i.status === 'active')
        .map((i) => i.eventId),
    );
    groups
      .filter((g) => g.members.includes(currentUser.id))
      .forEach((g) => viewerEventIds.add(g.eventId));

    const items: BuddySeekDiscoveryItem[] = [];

    for (const intent of intents) {
      if (intent.status !== 'active' || intent.creatorUserId === currentUser.id) continue;
      const seeker = users.find((u) => u.id === intent.creatorUserId);
      const event = events.find((e) => e.id === intent.eventId);
      if (!seeker || !event) continue;

      const viewerAlsoSeeking = viewerEventIds.has(event.id);
      if (
        !canViewerSeeBuddySeek(currentUser, seeker, intent, event, {
          viewerAlsoSeekingSameEvent: viewerAlsoSeeking,
          groups,
        })
      ) {
        continue;
      }

      items.push({
        intent,
        seeker,
        event,
        score: discoveryScoreForSeeker(currentUser, seeker, event, intent),
      });
    }

    return items.sort((a, b) => b.score - a.score).slice(0, limit);
  }, [currentUser, intents, users, events, groups, limit]);
}

export function useMyBuddySeekForEvent(eventId: string | undefined): CompanyRequest | null {
  const currentUser = useStore((s) => s.currentUser);
  const intents = useStore((s) => s.companyRequests);
  if (!currentUser || !eventId) return null;
  return (
    intents.find(
      (i) =>
        i.creatorUserId === currentUser.id &&
        i.eventId === eventId &&
        (i.status === 'active' || i.status === 'draft'),
    ) ?? null
  );
}

export function useCompanyRequestsForEvent(eventId: string, excludeSelf = true) {
  const currentUser = useStore((s) => s.currentUser);
  const intents = useStore((s) => s.companyRequests);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);

  return useMemo(() => {
    const event = events.find((e) => e.id === eventId);
    if (!event || !currentUser) return [];
    return intents
      .filter((i) => i.eventId === eventId && i.status === 'active')
      .filter((i) => !excludeSelf || i.creatorUserId !== currentUser.id)
      .map((intent) => {
        const seeker = users.find((u) => u.id === intent.creatorUserId)!;
        return { intent, seeker, event };
      })
      .filter(({ intent, seeker }) =>
        canViewerSeeBuddySeek(currentUser, seeker, intent, event, { groups }),
      );
  }, [currentUser, intents, users, events, groups, eventId, excludeSelf]);
}
