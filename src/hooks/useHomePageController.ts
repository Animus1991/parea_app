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
import { isEventPast } from '../lib/eventDisplay';
import { useStore } from '../store';
import { partitionQuietCatalog, storiesWithoutFeedDupes } from '../lib/quietCatalog';

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
  const [showConflicts, setShowConflicts] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [showJoined, setShowJoined] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const groups = useStore((s) => s.groups);
  const catalogEvents = useStore((s) => s.events);

  useHomeExternalEvents();
  const scrollToFilters = useHomeScrollToFilters();
  const { storyEvents: catalogStories, seekingHostEvents, isSeekingHost } = useStoryEvents();

  const feed = useHomeEventFeed({
    feedType,
    seekingHostOnly,
    isSeekingHost,
  });

  const { searchQuery, handleSearchChange, initialSearch, sortedEvents, clearAllFilters, isLoading, schedule } = feed;

  const hidePast = Boolean(searchQuery.trim());
  const buckets = useMemo(
    () =>
      partitionQuietCatalog(sortedEvents, {
        userId: feed.currentUser?.id,
        groups,
        catalog: catalogEvents,
        hidePast,
      }),
    [sortedEvents, feed.currentUser?.id, groups, catalogEvents, hidePast],
  );

  const shownEvents = useMemo(() => {
    const list = [...buckets.primary];
    if (showConflicts) list.push(...buckets.conflicts);
    if (showFull) list.push(...buckets.full);
    if (showJoined) list.push(...buckets.joined);
    if (showPast) list.push(...buckets.past);
    return list;
  }, [buckets, showConflicts, showFull, showJoined, showPast]);

  const storyEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let scheduled = isScheduleFilterActive(schedule)
      ? catalogStories.filter((event) => eventMatchesSchedule(event, schedule))
      : catalogStories;
    if (q) {
      scheduled = scheduled.filter((event) => {
        const inTitle = event.title.toLowerCase().includes(q);
        const inTags = (event.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
        return inTitle || inTags;
      });
    }
    if (hidePast) scheduled = scheduled.filter((event) => !isEventPast(event));
    return storiesWithoutFeedDupes(
      scheduled,
      new Set(shownEvents.slice(0, visibleEventsCount).map((event) => event.id)),
    );
  }, [catalogStories, schedule, shownEvents, visibleEventsCount, searchQuery, hidePast]);

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

  const visibleEvents = shownEvents.slice(0, visibleEventsCount);
  const hasMoreEvents = visibleEventsCount < shownEvents.length;

  const loadMoreEvents = useCallback(() => {
    setVisibleEventsCount((count) => Math.min(count + HOME_FEED_PAGE_SIZE, shownEvents.length));
  }, [shownEvents.length]);

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
    shownEvents,
    hasMoreEvents,
    loadMoreEvents,
    searchRef,
    loadMoreRef,
    scrollToFilters,
    storyEvents,
    conflictCount: buckets.conflicts.length,
    showConflicts,
    onToggleConflicts: () => setShowConflicts((v) => !v),
    fullCount: buckets.full.length,
    showFull,
    onToggleFull: () => setShowFull((v) => !v),
    joinedCount: buckets.joined.length,
    showJoined,
    onToggleJoined: () => setShowJoined((v) => !v),
    pastCount: buckets.past.length,
    showPast,
    onTogglePast: () => setShowPast((v) => !v),
    seekingHostEvents,
    isSeekingHost,
    feed,
    searchSuggestions,
    handleClearAll,
    searchQuery,
    handleSearchChange,
  };
}
