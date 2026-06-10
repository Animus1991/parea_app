import { useMemo } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { filterHomeEvents, sortHomeEvents } from '../lib/homeEventFeed';
import { getHomeMoodById } from '../lib/homeMoodConstants';
import { useHomeUrlFilters } from './useHomeUrlFilters';
import { useHomeGeoDistance } from './useHomeGeoDistance';
import { useEventsQuery } from './useEventsQuery';

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
  const { data: events = [] } = useEventsQuery();
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
        moodCategories: filters.moodCategories,
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
      filters.moodCategories,
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

  const setActiveCategory = (cat: string) => {
    if (cat !== 'All') filters.clearMood();
    filters.setActiveCategory(cat);
  };

  const setTagFilter = (tag: string) => {
    if (tag !== 'All') filters.clearMood();
    filters.setTagFilter(tag);
  };

  const handleSelectMood = (moodId: string | null, _categories: string[]) => {
    const mood = getHomeMoodById(moodId);
    if (!moodId || !mood) {
      filters.clearMood();
      return;
    }
    filters.setActiveMood(moodId);
    filters.setActiveCategory('All');
    filters.setTagFilter('All');
    document.getElementById('home-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return {
    ...filters,
    setActiveCategory,
    setTagFilter,
    handleSelectMood,
    currentUser,
    filteredEvents,
    sortedEvents,
    getDistance,
    hasActiveFilters,
    activeFilterCount,
    clearAllFilters,
  };
}
