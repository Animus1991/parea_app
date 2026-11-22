import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Calendar,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../common/Button';
import { Chip } from '../common/Chip';
import { AppSelect } from '../common/AppSelect';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { EventCard } from '../events/EventCard';
import { DiscoverCardImagePicker } from '../home/DiscoverCardImagePicker';
import { CollectionsRail } from '../outings/CollectionsRail';
import { useDiscoverCardImageDepth } from '../../hooks/useDiscoverCardImageDepth';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { useGeolocation } from '../../hooks/useGeolocation';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import type { Event } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { CATEGORY_CATALOG, CATEGORY_GROUP_TABS, getCategoryGroupTabLabel, type CategoryGroupTab } from '../../lib/categoriesCatalog';
import { formingGroups } from '../../lib/outings';
import { eventOccursAt, isEventPast } from '../../lib/eventDisplay';
import { countNoun } from '../../lib/plural';
import { foldSearchText } from '../../lib/greekText';
import { ATHENS_CENTER } from '../../lib/haversine';
import { CategoriesHero } from './CategoriesHero';
import {
  matchesCategoryFilter,
  matchesDateFilter,
  matchesEventQuery,
  sortEventsByDistance,
  type DateFilter,
  type PriceFilter,
  type SortBy,
} from '../../lib/categoryFilters';

const DEFAULT_PRICE: PriceFilter = 'All';
const DEFAULT_DATE: DateFilter = 'Any';
const DEFAULT_SORT: SortBy = 'Trending';
const DEFAULT_GROUP: CategoryGroupTab = 'All';
const PAGE_SIZE = 12;

const PRICE_FILTERS: PriceFilter[] = ['All', 'Free', 'Paid', 'Group Discount'];
const DATE_FILTERS: DateFilter[] = ['Any', 'Today', 'This Week', 'This Month', 'Weekend'];
const SORT_OPTIONS: SortBy[] = ['Relevance', 'Trending', 'Distance', 'Group Progress'];

function readFilterParams(params: URLSearchParams) {
  const category = params.get('c');
  const group = params.get('g');
  const price = params.get('price');
  const when = params.get('when');
  const sort = params.get('sort');

  return {
    activeCategory: CATEGORY_CATALOG.some((item) => item.name === category) ? category : null,
    activeTab: CATEGORY_GROUP_TABS.find((item) => item === group) ?? DEFAULT_GROUP,
    priceFilter: PRICE_FILTERS.find((item) => item === price) ?? DEFAULT_PRICE,
    dateFilter: DATE_FILTERS.find((item) => item === when) ?? DEFAULT_DATE,
    sortBy: SORT_OPTIONS.find((item) => item === sort) ?? DEFAULT_SORT,
    searchQuery: params.get('q') ?? '',
  };
}

function scrollToEvents() {
  const area = document.getElementById('events-area');
  const scroller = document.getElementById('main-content');
  if (!area || !scroller) return;
  const nextTop =
    area.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    12;
  scroller.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

const SELECT_CLASS =
  'filter-select shrink-0 border pr-2 shadow-soft transition-colors focus:outline-none';

export default function CategoriesPageContent() {
  const cardImage = useDiscoverCardImageDepth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, tu, language } = useLanguage();
  const contrast = usePageContrast();
  const { events, isLoading, isError, refetch } = useEventsResource();
  const groups = useStore((state) => state.groups);
  const {
    granted: locationGranted,
    loading: locationLoading,
    lat: locationLat,
    lng: locationLng,
    request: requestLocation,
  } = useGeolocation();
  const now = useMemo(() => new Date(), []);
  const lastSynchronizedSearch = useRef<string | null>(null);
  const skipUrlSync = useRef(false);
  const locationRequestStarted = useRef(false);
  const initialFilters = readFilterParams(searchParams);

  const [activeCategory, setActiveCategory] = useState<string | null>(initialFilters.activeCategory);
  const [activeTab, setActiveTab] = useState<CategoryGroupTab>(initialFilters.activeTab);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(initialFilters.priceFilter);
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialFilters.dateFilter);
  const [sortBy, setSortBy] = useState<SortBy>(initialFilters.sortBy);
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (lastSynchronizedSearch.current === params.toString()) {
      lastSynchronizedSearch.current = null;
      return;
    }

    skipUrlSync.current = true;
    const filters = readFilterParams(params);
    setActiveCategory(filters.activeCategory);
    setActiveTab(filters.activeTab);
    setPriceFilter(filters.priceFilter);
    setDateFilter(filters.dateFilter);
    setSortBy(filters.sortBy);
    setSearchQuery(filters.searchQuery);

    const normalized = new URLSearchParams(params);
    const setOrDelete = (key: string, value: string | null) => {
      if (value) normalized.set(key, value);
      else normalized.delete(key);
    };
    setOrDelete('c', filters.activeCategory);
    setOrDelete('q', filters.searchQuery.trim() || null);
    setOrDelete('g', filters.activeTab === DEFAULT_GROUP ? null : filters.activeTab);
    setOrDelete('price', filters.priceFilter === DEFAULT_PRICE ? null : filters.priceFilter);
    setOrDelete('when', filters.dateFilter === DEFAULT_DATE ? null : filters.dateFilter);
    setOrDelete('sort', filters.sortBy === DEFAULT_SORT ? null : filters.sortBy);
    if (normalized.toString() !== params.toString()) {
      lastSynchronizedSearch.current = normalized.toString();
      setSearchParams(normalized, { replace: true, preventScrollReset: true });
    }
  }, [location.search, setSearchParams]);

  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }

    const next = new URLSearchParams(location.search);
    const setOrDelete = (key: string, value: string | null) => {
      if (value) next.set(key, value);
      else next.delete(key);
    };
    setOrDelete('c', activeCategory);
    setOrDelete('q', searchQuery.trim() || null);
    setOrDelete('g', activeTab === DEFAULT_GROUP ? null : activeTab);
    setOrDelete('price', priceFilter === DEFAULT_PRICE ? null : priceFilter);
    setOrDelete('when', dateFilter === DEFAULT_DATE ? null : dateFilter);
    setOrDelete('sort', sortBy === DEFAULT_SORT ? null : sortBy);

    if (next.toString() === new URLSearchParams(location.search).toString()) return;
    const delay = searchQuery.trim() === (new URLSearchParams(location.search).get('q') ?? '') ? 0 : 300;
    const timer = window.setTimeout(() => {
      lastSynchronizedSearch.current = next.toString();
      setSearchParams(next, { replace: true, preventScrollReset: true });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    activeCategory,
    activeTab,
    dateFilter,
    location.search,
    priceFilter,
    searchQuery,
    setSearchParams,
    sortBy,
  ]);

  useEffect(() => {
    if (!activeCategory) return;
    const timer = window.setTimeout(scrollToEvents, 80);
    return () => window.clearTimeout(timer);
  }, [activeCategory]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeTab, dateFilter, priceFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (sortBy !== 'Distance' || locationGranted || locationLoading || locationRequestStarted.current) return;
    locationRequestStarted.current = true;
    requestLocation();
  }, [locationGranted, locationLoading, requestLocation, sortBy]);

  const upcomingCatalogEvents = useMemo(
    () => events.filter((event) => !isEventPast(event, now)),
    [events, now],
  );

  const categoryStats = useMemo(() => {
    const stats = CATEGORY_CATALOG.map((category) => ({
      ...category,
      count: 0,
      forming: 0,
      displayName: language === 'el' ? category.labelGr : category.labelEn,
    }));
    const byName = new Map(stats.map((category) => [category.name, category]));
    for (const event of upcomingCatalogEvents) {
      const category = byName.get(event.category);
      if (!category) continue;
      category.count += 1;
      category.forming += formingGroups(event, groups).length;
    }
    return stats;
  }, [groups, language, upcomingCatalogEvents]);

  const sortedCategories = useMemo(() => {
    let categories = [...categoryStats];
    const query = foldSearchText(searchQuery);
    if (query) {
      categories = categories.filter(
        (category) =>
          foldSearchText(category.displayName).includes(query) ||
          foldSearchText(category.name).includes(query),
      );
    }
    if (activeTab !== DEFAULT_GROUP) {
      categories = categories.filter((category) => category.group === activeTab);
    }
    return categories.sort((a, b) => b.count - a.count);
  }, [activeTab, categoryStats, searchQuery]);

  const trendingCategories = useMemo(
    () => [...categoryStats].sort((a, b) => b.count - a.count).slice(0, 3),
    [categoryStats],
  );
  const totalFormingGroups = useMemo(
    () => upcomingCatalogEvents.reduce((total, event) => total + formingGroups(event, groups).length, 0),
    [groups, upcomingCatalogEvents],
  );

  const activeCategoryIndex = sortedCategories.findIndex((category) => category.name === activeCategory);
  const categoriesAlwaysExpanded =
    Boolean(searchQuery.trim()) || activeCategoryIndex >= 8 || (Boolean(activeCategory) && activeCategoryIndex < 0);
  const hideMobileExtraCategories = !categoriesExpanded && !categoriesAlwaysExpanded;
  const canToggleCategories =
    !searchQuery.trim() && activeCategoryIndex < 8 && !categoriesAlwaysExpanded && sortedCategories.length > 8;

  const distanceOrigin = useMemo(
    () =>
      locationGranted && typeof locationLat === 'number' && typeof locationLng === 'number'
        ? { lat: locationLat, lng: locationLng }
        : ATHENS_CENTER,
    [locationGranted, locationLat, locationLng],
  );

  const filteredEvents = useMemo(() => {
    const matched = events.filter((event) => {
      if (!matchesCategoryFilter(event, activeCategory)) return false;
      if (priceFilter === 'Free' && event.isPaid) return false;
      if (priceFilter === 'Paid' && !event.isPaid) return false;
      if (priceFilter === 'Group Discount' && !event.groupDiscount) return false;
      if (!matchesEventQuery(event, searchQuery)) return false;
      return matchesDateFilter(eventOccursAt(event), dateFilter, now);
    });

    const upcoming = matched.filter((event) => !isEventPast(event, now));
    const past = matched.filter((event) => isEventPast(event, now));
    const sortList = (list: Event[]) => {
      if (sortBy === 'Distance') return sortEventsByDistance(list, distanceOrigin);
      return [...list].sort((a, b) => {
        if (sortBy === 'Trending') {
          return (b.currentParticipants || 0) - (a.currentParticipants || 0);
        }
        if (sortBy === 'Group Progress') {
          const progressA = (a.currentParticipants || 0) / (a.maxParticipants || 1);
          const progressB = (b.currentParticipants || 0) / (b.maxParticipants || 1);
          return progressB - progressA;
        }
        return 0;
      });
    };

    return { upcoming: sortList(upcoming), past: sortList(past) };
  }, [
    activeCategory,
    dateFilter,
    distanceOrigin,
    events,
    now,
    priceFilter,
    searchQuery,
    sortBy,
  ]);

  const activeCategoryItem = CATEGORY_CATALOG.find((category) => category.name === activeCategory);
  const activeCategoryLabel = activeCategoryItem
    ? language === 'el'
      ? activeCategoryItem.labelGr
      : activeCategoryItem.labelEn
    : '';
  const hasAdditionalFilters =
    activeTab !== DEFAULT_GROUP ||
    priceFilter !== DEFAULT_PRICE ||
    dateFilter !== DEFAULT_DATE ||
    sortBy !== DEFAULT_SORT ||
    Boolean(searchQuery.trim());

  const chooseCategory = (name: string) => {
    setActiveCategory((current) => (current === name ? null : name));
  };

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveTab(DEFAULT_GROUP);
    setPriceFilter(DEFAULT_PRICE);
    setDateFilter(DEFAULT_DATE);
    setSortBy(DEFAULT_SORT);
    setSearchQuery('');
  };

  const selectTone = contrast.isDark
    ? 'border-gray-700 bg-gray-800/80 text-gray-200'
    : 'cursor-pointer border-gray-200 bg-white text-gray-800';
  const remainingEvents = Math.max(0, filteredEvents.upcoming.length - visibleCount);

  return (
    <div className="mx-auto max-w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in md:space-y-5">
      <CategoriesHero
        query={searchQuery}
        onQuery={setSearchQuery}
        onSubmit={scrollToEvents}
        trending={trendingCategories}
        totals={{
          categories: CATEGORY_CATALOG.length,
          events: upcomingCatalogEvents.length,
          forming: totalFormingGroups,
        }}
        onPick={chooseCategory}
      />

      {!searchQuery.trim() && (
        <div
          role="group"
          aria-label={t('Ομάδες κατηγοριών', 'Category groups')}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 noscrollbar"
        >
          {CATEGORY_GROUP_TABS.map((tab) => (
            <Chip
              key={tab}
              active={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                setActiveCategory(null);
              }}
              className="h-9 shrink-0 whitespace-nowrap"
            >
              {getCategoryGroupTabLabel(tab, t)}
            </Chip>
          ))}
        </div>
      )}

      {sortedCategories.length > 0 && (
        <div className="space-y-2">
          <div
            data-testid="category-tiles"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {sortedCategories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                data-testid="category-tile"
                data-category-name={category.name}
                aria-pressed={activeCategory === category.name}
                onClick={() => chooseCategory(category.name)}
                className={cn(
                  'flex min-h-14 items-center gap-3 rounded-2xl border p-2.5 text-left text-xs shadow-soft transition-colors',
                  contrast.cardSurface,
                  activeCategory === category.name
                    ? 'border-accent ring-1 ring-accent'
                    : cn(contrast.borderB, contrast.isDark ? 'hover:border-gray-500' : 'hover:border-border-strong'),
                  category.count === 0 && 'opacity-60',
                  hideMobileExtraCategories && index >= 8 && 'hidden sm:block',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    category.bg,
                    category.border,
                  )}
                >
                  <category.icon className={cn('h-4 w-4', category.color)} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block truncate text-sm font-bold', contrast.head)}>
                    {category.displayName}
                  </span>
                  <span className={cn('block text-xs font-medium', contrast.muted)}>
                    {t(
                      countNoun(category.count, 'εκδήλωση', 'εκδηλώσεις'),
                      countNoun(category.count, 'event', 'events'),
                    )}
                    {category.forming > 0 && (
                      <span className="block text-accent sm:inline sm:text-ink-muted">
                        <span className="hidden sm:inline"> · </span>
                        {t(
                          countNoun(category.forming, 'παρέα', 'παρέες'),
                          countNoun(category.forming, 'group', 'groups'),
                        )}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {canToggleCategories && (
            <button
              type="button"
              aria-expanded={categoriesExpanded}
              onClick={() => setCategoriesExpanded((expanded) => !expanded)}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-1 rounded-xl border text-xs font-semibold sm:hidden',
                contrast.borderB,
                contrast.head,
              )}
            >
              {categoriesExpanded
                ? t('Λιγότερες ▴', 'Fewer ▴')
                : t(
                    `Όλες οι ${sortedCategories.length} κατηγορίες ▾`,
                    `All ${sortedCategories.length} categories ▾`,
                  )}
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', categoriesExpanded && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      )}

      {!searchQuery.trim() && <CollectionsRail />}

      {sortedCategories.length === 0 && filteredEvents.upcoming.length === 0 && (
        <EmptyState
          character="explorer"
          icon={Search}
          title={t('Δεν βρέθηκαν αποτελέσματα', 'No categories match your search')}
          actionLabel={t('Καθαρισμός', 'Clear search')}
          onAction={clearFilters}
          secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
          onSecondary={() => navigate('/buddy-seek')}
        />
      )}

      <section className={cn('mt-6 scroll-mt-24 border-t pt-5', contrast.borderT)} id="events-area">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-soft',
                contrast.cardSurface,
                contrast.borderB,
              )}
            >
              {activeCategoryItem ? (
                <activeCategoryItem.icon className={cn('h-5 w-5', activeCategoryItem.color)} aria-hidden="true" />
              ) : (
                <Calendar className={cn('h-5 w-5', contrast.iconAccent)} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className={cn('text-sm font-bold tracking-tight md:text-base', contrast.head)}>
                {activeCategoryLabel || t('Όλες οι εκδηλώσεις', 'All Discoveries')}
              </h2>
              <p className={cn('mt-0.5 text-xs font-bold tracking-wider', contrast.muted)}>
                {filteredEvents.upcoming.length} {tu('αποτελέσματα', 'results found')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {activeCategoryItem && (
                  <Chip
                    active
                    onClick={() => setActiveCategory(null)}
                    aria-label={t(
                      `Αφαίρεση φίλτρου ${activeCategoryLabel}`,
                      `Remove ${activeCategoryLabel} filter`,
                    )}
                    className="h-8"
                  >
                    {activeCategoryLabel} ×
                  </Chip>
                )}
                {hasAdditionalFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={cn(
                      'h-8 rounded-lg px-2 text-xs font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                      contrast.iconAccent,
                    )}
                  >
                    {t('Καθαρισμός φίλτρων', 'Clear filters')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 noscrollbar">
            <AppSelect
              ariaLabel={t('Φίλτρο κόστους', 'Cost filter')}
              className={cn(SELECT_CLASS, selectTone)}
              value={priceFilter}
              onValueChange={(value) => setPriceFilter(value as PriceFilter)}
              options={[
                { value: 'All', label: t('Κόστος: Οποιοδήποτε', 'Cost: Any') },
                { value: 'Free', label: t('Μόνο δωρεάν', 'Free only') },
                { value: 'Paid', label: t('Μόνο επί πληρωμή', 'Paid only') },
                { value: 'Group Discount', label: t('Με ομαδική έκπτωση', 'Has Group Discount') },
              ]}
            />
            <AppSelect
              ariaLabel={t('Φίλτρο χρόνου', 'Time filter')}
              className={cn(SELECT_CLASS, selectTone)}
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value as DateFilter)}
              options={[
                { value: 'Any', label: t('Χρόνος: Οποτεδήποτε', 'Time: Anytime') },
                { value: 'Today', label: t('Σήμερα', 'Today') },
                { value: 'This Week', label: t('Αυτή την εβδομάδα', 'This Week') },
                { value: 'This Month', label: t('Αυτόν τον μήνα', 'This Month') },
                { value: 'Weekend', label: t('Το Σαββατοκύριακο', 'This Weekend') },
              ]}
            />
            <AppSelect
              ariaLabel={t('Ταξινόμηση', 'Sort by')}
              className={cn(SELECT_CLASS, selectTone)}
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
              options={[
                { value: 'Trending', label: t('Ταξινόμηση: Κορυφαία', 'Sort: Trending') },
                { value: 'Distance', label: t('Ταξινόμηση: Πιο κοντά', 'Sort: Nearest') },
                { value: 'Group Progress', label: t('Ταξινόμηση: Πρόοδος', 'Sort: Fill rate') },
                { value: 'Relevance', label: t('Ταξινόμηση: Σχετικότητα', 'Sort: Relevance') },
              ]}
            />
          </div>
        </div>

        <DiscoverCardImagePicker
          depth={cardImage.depth}
          options={cardImage.options}
          onChange={cardImage.setDepth}
        />

        <ResourceStateGate
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          loading={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <EventCardSkeleton key={`category-skeleton-${index}`} />
              ))}
            </div>
          }
          errorTitle={t('Αδυναμία φόρτωσης εκδηλώσεων', 'Could not load events')}
        >
          {filteredEvents.upcoming.length === 0 ? (
            <EmptyState
              character="explorer"
              icon={Bookmark}
              title={t('Δεν βρέθηκαν εκδηλώσεις', 'No upcoming events found')}
              actionLabel={t('Καθαρισμός φίλτρων', 'Clear filters')}
              onAction={clearFilters}
            />
          ) : (
            <>
              <div
                data-testid="upcoming-events-grid"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              >
                {filteredEvents.upcoming.slice(0, visibleCount).map((event) => (
                  <EventCard key={event.id} event={event} imageDepth={cardImage.depth} />
                ))}
              </div>
              {remainingEvents > 0 && (
                <Button
                  data-testid="show-more-events"
                  variant="outline"
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  {t(
                    `Δείξε περισσότερες (${remainingEvents})`,
                    `Show more (${remainingEvents})`,
                  )}
                </Button>
              )}
            </>
          )}
        </ResourceStateGate>

        {filteredEvents.past.length > 0 && (
          <details className={cn('mt-6 rounded-2xl border p-4', contrast.cardSurface, contrast.borderB)}>
            <summary className={cn('cursor-pointer text-sm font-semibold', contrast.head)}>
              {t('Περασμένες εκδηλώσεις', 'Past events')} ({filteredEvents.past.length})
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredEvents.past.map((event) => (
                <EventCard key={event.id} event={event} imageDepth={cardImage.depth} />
              ))}
            </div>
          </details>
        )}
      </section>

      <div
        className={cn(
          'mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border p-4 text-center shadow-soft md:flex-row md:justify-between md:p-5 md:text-left',
          contrast.cardSurface,
          contrast.borderB,
        )}
      >
        <div>
          <h3 className={cn('text-sm font-bold tracking-tight md:text-base', contrast.head)}>
            {t('Δεν βρήκες αυτό που έψαχνες;', "Couldn't find what you were looking for?")}
          </h3>
          <p className={cn('mt-1 text-xs font-medium', contrast.muted)}>
            {t('Γίνε οικοδεσπότης και φτιάξε τη δική σου.', 'Become a host and create your own.')}
          </p>
        </div>
        <Button onClick={() => navigate('/create')} size="md">
          {t('Δημιουργία νέας εμπειρίας', 'Create New Experience')}
        </Button>
      </div>
    </div>
  );
}
