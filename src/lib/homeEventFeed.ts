import { parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import type { Event } from '../types';
import type { User } from '../types';
import { isExternalApiEvent } from './runtimeMode';
import {
  eventMatchesUserInterest,
  getEventPersonalizationScore,
} from './homePersonalization';
import {
  HOME_MOCK_DISTANCES,
  type HomeDateFilter,
  type HomePriceFilter,
  type HomeRadiusFilter,
  type HomeSafetyFilter,
  type HomeSortParam,
} from './homeFeedConstants';

export interface HomeEventFilterInput {
  events: Event[];
  currentUser: User | null;
  feedType: 'For You' | 'Discover';
  searchQuery: string;
  activeCategory: string;
  tagFilter: string;
  priceFilter: HomePriceFilter;
  dateFilter: HomeDateFilter;
  safetyFilter: HomeSafetyFilter;
  radiusFilter: HomeRadiusFilter;
  moodCategories?: string[];
  seekingHostOnly: boolean;
  isSeekingHost: (event: Event) => boolean;
  getDistance: (eventId: string, lat?: number, lng?: number) => number | null;
}

export function filterHomeEvents(input: HomeEventFilterInput): Event[] {
  const {
    events,
    currentUser,
    feedType,
    searchQuery,
    activeCategory,
    tagFilter,
    priceFilter,
    dateFilter,
    safetyFilter,
    radiusFilter,
    moodCategories = [],
    seekingHostOnly,
    isSeekingHost,
    getDistance,
  } = input;

  return events.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = e.title.toLowerCase().includes(q);
      const inDesc = e.description?.toLowerCase().includes(q) ?? false;
      const inTags = (e.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inTags) return false;
    }

    if (feedType === 'For You') {
      const personalized = eventMatchesUserInterest(e, currentUser);
      const tagHits = currentUser
        ? (e.tags ?? []).filter((tag) => (currentUser.interests || []).includes(tag)).length
        : 0;
      if (
        !personalized &&
        tagHits === 0 &&
        !e.isTrending &&
        !isSeekingHost(e) &&
        isExternalApiEvent(e.id)
      ) {
        return false;
      }
    }

    if (activeCategory !== 'All' && e.category !== activeCategory) return false;
    if (moodCategories.length > 0 && !moodCategories.includes(e.category)) return false;
    if (tagFilter !== 'All' && !(e.tags ?? []).includes(tagFilter)) return false;
    if (priceFilter === 'Free' && e.isPaid) return false;
    if (priceFilter === 'Paid' && !e.isPaid) return false;
    if (priceFilter === 'Group Discount' && !e.groupDiscount) return false;
    if (safetyFilter !== 'All' && e.safetyLevel !== safetyFilter) return false;

    if (dateFilter !== 'Any') {
      const eDate = parseISO(e.date);
      if (dateFilter === 'Today' && !isToday(eDate)) return false;
      if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
      if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
    }

    if (radiusFilter !== 'Any') {
      const distance =
        getDistance(e.id, e.lat, e.lng) ?? HOME_MOCK_DISTANCES[e.id] ?? 5;
      if (radiusFilter === '5km' && distance > 5) return false;
      if (radiusFilter === '10km' && distance > 10) return false;
      if (radiusFilter === '25km' && distance > 25) return false;
    }

    if (seekingHostOnly && !isSeekingHost(e)) return false;

    return true;
  });
}

export function sortHomeEvents(
  events: Event[],
  sortParam: HomeSortParam,
  currentUser: User | null,
  getDistance: (eventId: string, lat?: number, lng?: number) => number | null,
): Event[] {
  return [...events].sort((a, b) => {
    if (sortParam === 'Distance') {
      const distA = getDistance(a.id, a.lat, a.lng) ?? HOME_MOCK_DISTANCES[a.id] ?? 5;
      const distB = getDistance(b.id, b.lat, b.lng) ?? HOME_MOCK_DISTANCES[b.id] ?? 5;
      return distA - distB;
    }

    if (sortParam === 'Group Progress') {
      const spacesA = (a.maxParticipants || 40) - 12;
      const spacesB = (b.maxParticipants || 40) - 12;
      return spacesA - spacesB;
    }

    const getMatchScore = (ev: Event) => {
      if (!currentUser) return 0;
      const base = getEventPersonalizationScore(ev, currentUser);
      const tagCount = (ev.tags ?? []).filter((tag) =>
        (currentUser.interests || []).includes(tag),
      ).length;
      return Math.min(99, 40 + base + tagCount * 8 + (ev.isTrending ? 12 : 0));
    };

    if (sortParam === 'Relevance' && currentUser) {
      return (
        getMatchScore(b) - getMatchScore(a) ||
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
