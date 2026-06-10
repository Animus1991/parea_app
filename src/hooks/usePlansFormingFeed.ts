import { useMemo } from 'react';
import { useStore } from '../store';
import { useBuddySeekDiscovery, type BuddySeekDiscoveryItem } from './useBuddySeekDiscovery';
import {
  enrichPlanItem,
  enrichRecruitingGroup,
  buildScarcityPromos,
  type PlansFormingEnrichedItem,
  type PlansFormingScarcityPromo,
} from '../lib/plansFormingUtils';
import type { CompanyRequest } from '../types/companyRequest';
import type { Event, Group } from '../types';

export interface PlansFormingGroupItem {
  group: Group;
  event: Event;
  meta: ReturnType<typeof enrichRecruitingGroup>;
}

export interface PlansFormingInsights {
  compatiblePlans: number;
  recruitingGroups: number;
  openSpots: number;
  savedPlans: number;
  pendingJoinsToReview: number;
  pendingJoinsSent: number;
}

export function usePlansFormingFeed(limit = 12) {
  const dismissed = useStore((s) => s.dismissedCompanyRequestIds);
  const savedRequestIds = useStore((s) => s.savedCompanyRequestIds);
  const savedEventIds = useStore((s) => s.savedEvents);
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const companyRequests = useStore((s) => s.companyRequests);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);
  const raw = useBuddySeekDiscovery(limit + dismissed.length + 8);

  const enrichedItems = useMemo(() => {
    if (!currentUser) return [];
    const filtered = raw
      .filter((item) => !dismissed.includes(item.intent.id))
      .slice(0, limit);
    return filtered.map((item) => enrichPlanItem(item, currentUser, savedEventIds));
  }, [raw, dismissed, limit, currentUser, savedEventIds]);

  const recruitingGroupItems: PlansFormingGroupItem[] = useMemo(() => {
    if (!currentUser) return [];
    return groups
      .filter(
        (g) =>
          (g.isRecruiting || g.members.length < g.targetSize) &&
          g.status !== 'cancelled' &&
          !g.members.includes(currentUser.id),
      )
      .map((g) => {
        const event = events.find((e) => e.id === g.eventId);
        if (!event) return null;
        const host = users.find((u) => u.id === (g.hostId ?? g.members[0]));
        return {
          group: g,
          event,
          meta: enrichRecruitingGroup(g, event, host),
        };
      })
      .filter((x): x is PlansFormingGroupItem => x !== null)
      .sort((a, b) => b.meta.spots - a.meta.spots)
      .slice(0, 6);
  }, [groups, events, users, currentUser]);

  const myActivePlan = useMemo((): PlansFormingEnrichedItem | null => {
    if (!currentUser) return null;
    const mine = companyRequests.find(
      (r) =>
        r.creatorUserId === currentUser.id &&
        (r.status === 'active' || r.status === 'draft' || r.status === 'paused'),
    );
    if (!mine) return null;
    const event = events.find((e) => e.id === mine.eventId);
    const seeker = users.find((u) => u.id === currentUser.id);
    if (!event || !seeker) return null;
    const base: BuddySeekDiscoveryItem = {
      intent: mine,
      seeker,
      event,
      score: 100,
    };
    return enrichPlanItem(base, currentUser, savedEventIds);
  }, [currentUser, companyRequests, events, users, savedEventIds]);

  const plansForSavedEvents = useMemo(() => {
    if (!savedEventIds.length) return [] as { event: Event; planCount: number }[];
    return savedEventIds
      .map((eventId) => {
        const event = events.find((e) => e.id === eventId);
        if (!event) return null;
        const planCount = companyRequests.filter(
          (r) => r.eventId === eventId && r.status === 'active' && r.creatorUserId !== currentUser?.id,
        ).length;
        return { event, planCount };
      })
      .filter((x): x is { event: Event; planCount: number } => x !== null && x.planCount > 0);
  }, [savedEventIds, events, companyRequests, currentUser]);

  const suggestedEvent = useMemo((): Event | null => {
    if (!currentUser || myActivePlan) return null;
    const upcoming = events
      .filter((e) => {
        try {
          return new Date(`${e.date}T${e.time || '20:00'}`) > new Date();
        } catch {
          return true;
        }
      })
      .filter((e) => savedEventIds.includes(e.id))
      .slice(0, 1);
    return upcoming[0] ?? events[0] ?? null;
  }, [currentUser, myActivePlan, events, savedEventIds]);

  const insights: PlansFormingInsights = useMemo(() => {
    const pendingJoinsToReview = companyJoinRequests.filter(
      (j) => j.status === 'pending' && j.targetUserId === currentUser?.id,
    ).length;
    const pendingJoinsSent = companyJoinRequests.filter(
      (j) => j.status === 'pending' && j.fromUserId === currentUser?.id,
    ).length;
    const openSpots = recruitingGroupItems.reduce((s, g) => s + g.meta.spots, 0);
    return {
      compatiblePlans: enrichedItems.length,
      recruitingGroups: recruitingGroupItems.length,
      openSpots,
      savedPlans: savedRequestIds.length,
      pendingJoinsToReview,
      pendingJoinsSent,
    };
  }, [
    enrichedItems.length,
    recruitingGroupItems,
    savedRequestIds.length,
    companyJoinRequests,
    currentUser,
  ]);

  const scarcityPromos = useMemo(
    () => buildScarcityPromos(groups, events, currentUser?.id),
    [groups, events, currentUser?.id],
  );

  const hasContent =
    enrichedItems.length > 0 || recruitingGroupItems.length > 0 || scarcityPromos.length > 0;

  return {
    items: enrichedItems,
    count: enrichedItems.length,
    recruitingGroups: recruitingGroupItems.map((g) => g.group),
    recruitingGroupItems,
    mergeOpportunities: recruitingGroupItems.slice(0, 3),
    savedIds: savedRequestIds,
    myActivePlan,
    plansForSavedEvents,
    suggestedEvent,
    insights,
    hasContent,
    scarcityPromos,
  };
}

export type {
  BuddySeekDiscoveryItem,
  PlansFormingEnrichedItem,
  PlansFormingScarcityPromo,
  CompanyRequest,
};
