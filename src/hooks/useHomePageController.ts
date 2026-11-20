/**
 * Shared Home feed controller — one place for filters/search/feed state so
 * HomeClassic and HomeThemedPageBody cannot drift on loyalty wiring.
 */
import { useEffect, useRef, useState } from 'react';
import { useHomeExternalEvents } from './useHomeExternalEvents';
import { useHomeEventFeed } from './useHomeEventFeed';
import { useHomeScrollToFilters } from './useHomeScrollToFilters';
import { useStoryEvents } from './useStoryEvents';
import { getDefaultHomeSearchSuggestions } from '../lib/homeSearchSuggestions';
import { useLanguage } from '../lib/i18n';

export function useHomePageController() {
  const { t } = useLanguage();
  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [seekingHostOnly, setSeekingHostOnly] = useState(false);
  const [visibleEventsCount, setVisibleEventsCount] = useState(6);
  const searchRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useHomeExternalEvents();
  const scrollToFilters = useHomeScrollToFilters();
  const { storyEvents, seekingHostEvents, isSeekingHost } = useStoryEvents();

  const feed = useHomeEventFeed({
    feedType,
    seekingHostOnly,
    isSeekingHost,
  });

  const { searchQuery, handleSearchChange, initialSearch, sortedEvents, clearAllFilters, isLoading } = feed;

  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType('Discover');
    }
  }, [initialSearch, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleEvents = sortedEvents.slice(0, visibleEventsCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && visibleEventsCount < sortedEvents.length) {
          setVisibleEventsCount((c) => Math.min(c + 6, sortedEvents.length));
        }
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isLoading, visibleEventsCount, sortedEvents.length]);

  const searchSuggestions = getDefaultHomeSearchSuggestions(t);

  const handleClearAll = () => {
    clearAllFilters();
    setSeekingHostOnly(false);
  };

  return {
    t,
    feedType,
    setFeedType,
    showSearchSuggestions,
    setShowSearchSuggestions,
    seekingHostOnly,
    setSeekingHostOnly,
    visibleEvents,
    hasMoreEvents: visibleEventsCount < sortedEvents.length,
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
