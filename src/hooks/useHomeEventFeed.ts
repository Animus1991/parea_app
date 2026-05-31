import { useMemo } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { filterHomeEvents, sortHomeEvents } from '../lib/homeEventFeed';
import { useHomeUrlFilters } from './useHomeUrlFilters';
import { useHomeGeoDistance } from './useHomeGeoDistance';

export interface UseHomeEventFeedOptions {
  feedType: 'For You' | 'Discover';
  seekingHostOnly: boolean;
  isSeekingHost: (event: Event) => boolean;
}

export function useHomeEventFeed({
  feedType,
  seekingHostOnly,
  isSeekingHost,
}: UseHomeEventFeedOptions) {
  const events = useStore((s) => s.events);
  const currentUser = useStore((s) => s.currentUser);
  const filters = useHomeUrlFilters();
  const { getDistance } = useHomeGeoDistance(filters.radiusFilter);

  const filteredEvents = useMemo(
    () =>
      filterHomeEvents({
        events,
        currentUser,
        feedType,
        searchQuery: filters.searchQuery,
        activeCategory: filters.activeCategory,
        tagFilter: filters.tagFilter,
        priceFilter: filters.priceFilter,
        dateFilter: filters.dateFilter,
        safetyFilter: filters.safetyFilter,
        radiusFilter: filters.radiusFilter,
        seekingHostOnly,
        isSeekingHost,
        getDistance,
      }),
    [
      events,
      currentUser,
      feedType,
      filters.searchQuery,
      filters.activeCategory,
      filters.tagFilter,
      filters.priceFilter,
      filters.dateFilter,
      filters.safetyFilter,
      filters.radiusFilter,
      seekingHostOnly,
      isSeekingHost,
      getDistance,
    ],
  );

  const sortedEvents = useMemo(
    () =>
      sortHomeEvents(
        filteredEvents,
        filters.sortParam,
        currentUser,
        getDistance,
      ),
    [filteredEvents, filters.sortParam, currentUser, getDistance],
  );

  const hasActiveFilters =
    filters.hasActiveFilters || seekingHostOnly;

  const activeFilterCount =
    filters.activeFilterCount + (seekingHostOnly ? 1 : 0);

  const clearAllFilters = () => {
    filters.clearUrlFilters();
  };

  return {
    ...filters,
    currentUser,
    filteredEvents,
    sortedEvents,
    getDistance,
    hasActiveFilters,
    activeFilterCount,
    clearAllFilters,
  };
}
