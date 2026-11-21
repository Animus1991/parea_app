import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import { useStore } from '../store';
import { getMoodCategories, parseHomeMoodParam } from '../lib/homeMoodConstants';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
  HomeSortParam,
} from '../lib/homeFeedConstants';
import {
  emptyHomeSchedule,
  isScheduleFilterActive,
  parseHomeScheduleFromSearch,
  readStoredHomeSchedule,
  schedulesEqual,
  serializeHomeSchedule,
  writeStoredHomeSchedule,
  type HomeScheduleFilter,
} from '../lib/homeScheduleFilter';
import { buildHomeFilterQuery, homeFilterQueryEquals, mergeHomeFilterQuery } from '../lib/homeUrlFilters';

export function useHomeUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const addRecentSearch = useStore((s) => s.addRecentSearch);
  const userId = useStore((s) => s.currentUser?.id ?? null);

  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get('cat') || 'All',
  );
  const [priceFilter, setPriceFilter] = useState<HomePriceFilter>(
    () => (searchParams.get('price') as HomePriceFilter) || 'All',
  );
  const [dateFilter, setDateFilter] = useState<HomeDateFilter>(
    () => (searchParams.get('date') as HomeDateFilter) || 'Any',
  );
  const [safetyFilter, setSafetyFilter] = useState<HomeSafetyFilter>(
    () => (searchParams.get('safety') as HomeSafetyFilter) || 'All',
  );
  const [radiusFilter, setRadiusFilter] = useState<HomeRadiusFilter>(
    () => (searchParams.get('dist') as HomeRadiusFilter) || 'Any',
  );
  const [tagFilter, setTagFilter] = useState(() => searchParams.get('tag') || 'All');
  const [activeMood, setActiveMood] = useState<string | null>(() =>
    parseHomeMoodParam(searchParams.get('mood')),
  );
  const [schedule, setScheduleState] = useState<HomeScheduleFilter>(() => {
    const fromUrl = parseHomeScheduleFromSearch(searchParams);
    if (isScheduleFilterActive(fromUrl)) return fromUrl;
    return readStoredHomeSchedule(userId) ?? emptyHomeSchedule();
  });

  const setSchedule = useCallback(
    (next: HomeScheduleFilter) => {
      setScheduleState(next);
      writeStoredHomeSchedule(next, userId);
    },
    [userId],
  );

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const moodCategories = useMemo(() => getMoodCategories(activeMood), [activeMood]);
  const hasMoodFilter = activeMood !== null && moodCategories.length > 0;

  const debouncedSearch = useDebounce(searchQuery, 400);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;
  const sortParam = (searchParams.get('sort') as HomeSortParam) || 'Distance';

  const setSortParam = useCallback(
    (value: HomeSortParam) => {
      const p = new URLSearchParams(searchParams);
      p.set('sort', value);
      setSearchParams(p);
    },
    [searchParams, setSearchParams],
  );

  const clearMood = useCallback(() => {
    setActiveMood(null);
  }, []);

  // URL → state only when the address actually changes (back/forward, shared link).
  // Do not depend on local filter state: that races the state → URL write and
  // ping-pongs Theater & Dance with All after the user dismisses the chip.
  useEffect(() => {
    const cat = searchParams.get('cat') || 'All';
    const tag = searchParams.get('tag') || 'All';
    const price = (searchParams.get('price') as HomePriceFilter) || 'All';
    const date = (searchParams.get('date') as HomeDateFilter) || 'Any';
    const safety = (searchParams.get('safety') as HomeSafetyFilter) || 'All';
    const dist = (searchParams.get('dist') as HomeRadiusFilter) || 'Any';
    const mood = parseHomeMoodParam(searchParams.get('mood'));

    setActiveCategory((prev) => (prev === cat ? prev : cat));
    setTagFilter((prev) => (prev === tag ? prev : tag));
    setPriceFilter((prev) => (prev === price ? prev : price));
    setDateFilter((prev) => (prev === date ? prev : date));
    setSafetyFilter((prev) => (prev === safety ? prev : safety));
    setRadiusFilter((prev) => (prev === dist ? prev : dist));
    setActiveMood((prev) => (prev === mood ? prev : mood));

    const fromUrl = parseHomeScheduleFromSearch(searchParams);
    if (isScheduleFilterActive(fromUrl)) {
      setScheduleState((prev) => (schedulesEqual(prev, fromUrl) ? prev : fromUrl));
    }

    const urlSearch = searchParams.get('search') || '';
    if (
      urlSearch !== debouncedSearchRef.current &&
      searchQueryRef.current === debouncedSearchRef.current
    ) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const filters = buildHomeFilterQuery({
      search: debouncedSearch,
      category: activeCategory,
      tag: tagFilter,
      price: priceFilter,
      date: dateFilter,
      safety: safetyFilter,
      dist: radiusFilter,
      sort: sortParam,
      mood: activeMood,
      schedule: serializeHomeSchedule(schedule),
    });
    if (homeFilterQueryEquals(filters, searchParamsRef.current)) return;
    setSearchParams(mergeHomeFilterQuery(searchParamsRef.current, filters), { replace: true });
    if (debouncedSearch.trim()) addRecentSearch(debouncedSearch.trim());
  }, [
    debouncedSearch,
    activeCategory,
    tagFilter,
    priceFilter,
    dateFilter,
    safetyFilter,
    radiusFilter,
    sortParam,
    activeMood,
    schedule,
    setSearchParams,
    addRecentSearch,
  ]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      activeCategory !== 'All' ||
      tagFilter !== 'All' ||
      priceFilter !== 'All' ||
      dateFilter !== 'Any' ||
      safetyFilter !== 'All' ||
      radiusFilter !== 'Any' ||
      hasMoodFilter ||
      isScheduleFilterActive(schedule) ||
      searchQuery.length > 0,
    [
      activeCategory,
      tagFilter,
      priceFilter,
      dateFilter,
      safetyFilter,
      radiusFilter,
      hasMoodFilter,
      schedule,
      searchQuery,
    ],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        activeCategory !== 'All',
        priceFilter !== 'All',
        dateFilter !== 'Any',
        safetyFilter !== 'All',
        radiusFilter !== 'Any',
        tagFilter !== 'All',
        hasMoodFilter,
        isScheduleFilterActive(schedule),
      ].filter(Boolean).length,
    [activeCategory, priceFilter, dateFilter, safetyFilter, radiusFilter, tagFilter, hasMoodFilter, schedule],
  );

  const clearUrlFilters = useCallback(() => {
    setActiveCategory('All');
    setTagFilter('All');
    setPriceFilter('All');
    setDateFilter('Any');
    setSafetyFilter('All');
    setRadiusFilter('Any');
    setSearchQuery('');
    setActiveMood(null);
    setSchedule(emptyHomeSchedule());
  }, [setSchedule]);

  return {
    searchParams,
    setSearchParams,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    debouncedSearch,
    initialSearch,
    activeCategory,
    setActiveCategory,
    priceFilter,
    setPriceFilter,
    dateFilter,
    setDateFilter,
    safetyFilter,
    setSafetyFilter,
    radiusFilter,
    setRadiusFilter,
    tagFilter,
    setTagFilter,
    sortParam,
    setSortParam,
    activeMood,
    setActiveMood,
    moodCategories,
    hasMoodFilter,
    clearMood,
    hasActiveFilters,
    activeFilterCount,
    clearUrlFilters,
    schedule,
    setSchedule,
  };
}
