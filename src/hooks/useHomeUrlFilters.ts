import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import { useStore } from '../store';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
  HomeSortParam,
} from '../lib/homeFeedConstants';

export function useHomeUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const addRecentSearch = useStore((s) => s.addRecentSearch);

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

  const debouncedSearch = useDebounce(searchQuery, 400);
  const sortParam = (searchParams.get('sort') as HomeSortParam) || 'Relevance';

  const setSortParam = useCallback(
    (value: HomeSortParam) => {
      const p = new URLSearchParams(searchParams);
      p.set('sort', value);
      setSearchParams(p);
    },
    [searchParams, setSearchParams],
  );

  // Keep filter state in sync when URL changes (browser back/forward, shared links).
  useEffect(() => {
    const cat = searchParams.get('cat') || 'All';
    const tag = searchParams.get('tag') || 'All';
    const price = (searchParams.get('price') as HomePriceFilter) || 'All';
    const date = (searchParams.get('date') as HomeDateFilter) || 'Any';
    const safety = (searchParams.get('safety') as HomeSafetyFilter) || 'All';
    const dist = (searchParams.get('dist') as HomeRadiusFilter) || 'Any';

    if (cat !== activeCategory) setActiveCategory(cat);
    if (tag !== tagFilter) setTagFilter(tag);
    if (price !== priceFilter) setPriceFilter(price);
    if (date !== dateFilter) setDateFilter(date);
    if (safety !== safetyFilter) setSafetyFilter(safety);
    if (dist !== radiusFilter) setRadiusFilter(dist);

    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch && searchQuery === debouncedSearch) {
      setSearchQuery(urlSearch);
    }
  }, [
    searchParams,
    activeCategory,
    tagFilter,
    priceFilter,
    dateFilter,
    safetyFilter,
    radiusFilter,
    debouncedSearch,
    searchQuery,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (activeCategory !== 'All') params.set('cat', activeCategory);
    if (tagFilter !== 'All') params.set('tag', tagFilter);
    if (priceFilter !== 'All') params.set('price', priceFilter);
    if (dateFilter !== 'Any') params.set('date', dateFilter);
    if (safetyFilter !== 'All') params.set('safety', safetyFilter);
    if (radiusFilter !== 'Any') params.set('dist', radiusFilter);
    if (sortParam !== 'Relevance') params.set('sort', sortParam);
    setSearchParams(params, { replace: true });
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
      searchQuery.length > 0,
    [
      activeCategory,
      tagFilter,
      priceFilter,
      dateFilter,
      safetyFilter,
      radiusFilter,
      searchQuery,
    ],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        priceFilter !== 'All',
        dateFilter !== 'Any',
        safetyFilter !== 'All',
        radiusFilter !== 'Any',
        tagFilter !== 'All',
      ].filter(Boolean).length,
    [priceFilter, dateFilter, safetyFilter, radiusFilter, tagFilter],
  );

  const clearUrlFilters = useCallback(() => {
    setActiveCategory('All');
    setTagFilter('All');
    setPriceFilter('All');
    setDateFilter('Any');
    setSafetyFilter('All');
    setRadiusFilter('Any');
    setSearchQuery('');
  }, []);

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
    hasActiveFilters,
    activeFilterCount,
    clearUrlFilters,
  };
}
