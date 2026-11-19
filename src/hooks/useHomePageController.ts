/**
 * Shared Home feed controller — one place for filters/search/feed state so
 * HomeClassic and HomeThemedPageBody cannot drift on loyalty wiring.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHomeExternalEvents } from './useHomeExternalEvents';
import { useHomeEventFeed } from './useHomeEventFeed';
import { useHomeScrollToFilters } from './useHomeScrollToFilters';
import { useStoryEvents } from './useStoryEvents';
import { getDefaultHomeSearchSuggestions } from '../lib/homeSearchSuggestions';
import { useLanguage } from '../lib/i18n';
import { DESKTOP_DOCK_QUERY, useMediaQuery } from './useMediaQuery';
import { eventMatchesSchedule, isScheduleFilterActive } from '../lib/homeScheduleFilter';

const HOME_FEED_PAGE_SIZE = 6;

export function useHomePageController() {
  const { t } = useLanguage();
  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const isDesktopFilters = useMediaQuery(DESKTOP_DOCK_QUERY);
  const [seekingHostOnly, setSeekingHostOnly] = useState(false);
  const [visibleEventsCount, setVisibleEventsCount] = useState(HOME_FEED_PAGE_SIZE);
  const searchRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useHomeExternalEvents();
  const scrollToFilters = useHomeScrollToFilters();
  const { storyEvents: catalogStories, seekingHostEvents, isSeekingHost } = useStoryEvents();

  const feed = useHomeEventFeed({
    feedType,
    seekingHostOnly,
    isSeekingHost,
  });

  const { searchQuery, handleSearchChange, initialSearch, sortedEvents, clearAllFilters, isLoading, schedule } = feed;

  const storyEvents = useMemo(() => {
    if (!isScheduleFilterActive(schedule)) return catalogStories;
    return catalogStories.filter((event) => eventMatchesSchedule(event, schedule));
  }, [catalogStories, schedule]);

  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType('Discover');
    }
  }, [initialSearch, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const node = e.target as Node | null;
      if (searchRef.current?.contains(node)) return;
      if (node instanceof Element && node.closest('[data-home-search-menu]')) return;
      setShowSearchSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleEvents = sortedEvents.slice(0, visibleEventsCount);
  const hasMoreEvents = visibleEventsCount < sortedEvents.length;

  const loadMoreEvents = useCallback(() => {
    setVisibleEventsCount((count) => Math.min(count + HOME_FEED_PAGE_SIZE, sortedEvents.length));
  }, [sortedEvents.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoading || !hasMoreEvents) return;
    const root = document.getElementById('main-content');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreEvents();
      },
      { root, rootMargin: '0px 0px 280px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading, hasMoreEvents, loadMoreEvents, visibleEventsCount]);

  const searchSuggestions = getDefaultHomeSearchSuggestions(t);

  const handleClearAll = () => {
    clearAllFilters();
    setSeekingHostOnly(false);
  };

  useEffect(() => {
    if (isDesktopFilters) setFilterSheetOpen(false);
    else setFiltersExpanded(false);
  }, [isDesktopFilters]);

  const filtersOpen = isDesktopFilters ? filtersExpanded : filterSheetOpen;
  const toggleFilters = () => {
    if (isDesktopFilters) setFiltersExpanded((open) => !open);
    else setFilterSheetOpen((open) => !open);
  };

  return {
    t,
    feedType,
    setFeedType,
    showSearchSuggestions,
    setShowSearchSuggestions,
    filterSheetOpen,
    setFilterSheetOpen,
    filtersExpanded,
    filtersOpen,
    toggleFilters,
    seekingHostOnly,
    setSeekingHostOnly,
    visibleEvents,
    hasMoreEvents,
    loadMoreEvents,
    searchRef,
    loadMoreRef,
    scrollToFilters,
    storyEvents,
    seekingHostEvents,
    isSeekingHost,
    feed,
    searchSuggestions,
    handleClearAll,
    searchQuery,
    handleSearchChange,
  };
}
