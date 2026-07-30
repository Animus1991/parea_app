import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { EventCard } from '../events/EventCard';
import { EventCardSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { Map as MapIcon, CalendarX } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { EventStories } from './EventStories';
import { HomeBuddySeekStrip } from '../buddySeek/HomeBuddySeekStrip';
import { ActiveBuddiesRail } from './ActiveBuddiesRail';
import { HomeQuickActions } from './HomeQuickActions';
import { HomeThemedEnrichment } from './HomeThemedEnrichment';
import { HomeThemedHeroSwitch } from './HomeThemedHeroSwitch';
import { HomeRichHero } from './HomeRichHero';
import { HomeFiltersSection } from './HomeFiltersSection';
import { HomeMobileFilterSheet } from './HomeMobileFilterSheet';
import { getTimeGreeting, getMotivation } from '../../lib/homeGreeting';
import { getDefaultHomeSearchSuggestions } from '../../lib/homeSearchSuggestions';
import { useStoryEvents } from '../../hooks/useStoryEvents';
import { useHomeExternalEvents } from '../../hooks/useHomeExternalEvents';
import { useHomeScrollToFilters } from '../../hooks/useHomeScrollToFilters';
import { useHomeEventFeed } from '../../hooks/useHomeEventFeed';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { HOME_THEMED_TOKENS, type HomeThemedVariant } from '../../lib/homeThemedTokens';
import { cn } from '../../lib/utils';

/**
 * Canonical themed Home — ONE implementation for vibrant/neon/bento × light/dark.
 * Theme-specific classes come from HOME_THEMED_TOKENS[variant]; classic/activebuddies
 * themes keep their own token-driven HomeClassic lineage.
 */
export default function HomeThemedPageBody({ variant }: { variant: HomeThemedVariant }) {
  const tok = HOME_THEMED_TOKENS[variant];
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [seekingHostOnly, setSeekingHostOnly] = useState(false);
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

  const {
    searchQuery,
    handleSearchChange,
    initialSearch,
    activeCategory,
    setActiveCategory,
    tagFilter,
    setTagFilter,
    priceFilter,
    setPriceFilter,
    dateFilter,
    setDateFilter,
    safetyFilter,
    setSafetyFilter,
    radiusFilter,
    setRadiusFilter,
    sortParam,
    setSortParam,
    sortedEvents,
    hasActiveFilters,
    activeFilterCount,
    clearAllFilters,
    activeMood,
    handleSelectMood,
  } = feed;

  const currentUser = feed.currentUser;
  const firstName = currentUser?.name?.split(' ')[0] || t('φίλε', 'there');
  const greeting = getTimeGreeting(firstName, t);
  const motivation = getMotivation(t);

  const handleClearAll = () => {
    clearAllFilters();
    setSeekingHostOnly(false);
  };

  const searchSuggestions = getDefaultHomeSearchSuggestions(t);

  // Sync to 'Discover' feed when the page is loaded with a search query
  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType('Discover');
    }
  }, [initialSearch, searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [visibleEventsCount, setVisibleEventsCount] = useState(6);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const visibleEvents = sortedEvents.slice(0, visibleEventsCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          visibleEventsCount < sortedEvents.length
        ) {
          setVisibleEventsCount((c) => Math.min(c + 6, sortedEvents.length));
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, visibleEventsCount, sortedEvents.length]);

  return (
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-0">
      <HomeThemedHeroSwitch
        greeting={greeting}
        motivation={motivation}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchRef={searchRef}
        showSearchSuggestions={showSearchSuggestions}
        onSearchFocus={() => setShowSearchSuggestions(true)}
        searchSuggestions={searchSuggestions}
        onPickSuggestion={(s) => {
          handleSearchChange(s);
          setShowSearchSuggestions(false);
        }}
        richHero={
          <HomeRichHero
            tokens={tok}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchRef={searchRef}
            showSearchSuggestions={showSearchSuggestions}
            onSearchFocus={() => setShowSearchSuggestions(true)}
            searchSuggestions={searchSuggestions}
            onPickSuggestion={(s) => {
              handleSearchChange(s);
              setShowSearchSuggestions(false);
            }}
          />
        }
      />

      <EventStories events={storyEvents} />

      <HomeBuddySeekStrip />

      <HomeQuickActions onScrollToCategories={scrollToFilters} />
      <ActiveBuddiesRail />

      <HomeThemedEnrichment
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={() => setSeekingHostOnly((v) => !v)}
        onPreferDiscoverFeed={() => setFeedType('Discover')}
      />

      {/* How it works */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            step: '1',
            title: t('home.how.step1.title', 'Διαλέξτε μια εμπειρία'),
            body: t(
              'home.how.step1.body',
              'Επιλέξτε μια εκδήλωση, πεζοπορία ή δραστηριότητα που θέλετε να παρακολουθήσετε.',
            ),
          },
          {
            step: '2',
            title: t('home.how.step2.title', 'Εντάξτε μια μικρή ομάδα'),
            body: t(
              'home.how.step2.body',
              'Συνδεθείτε με 3-6 άτομα που μοιράζονται την ίδια πρόθεση και πρόγραμμα.',
            ),
          },
          {
            step: '3',
            title: t('home.how.step3.title', 'Επιβεβαιώστε & συναντηθείτε'),
            body: t(
              'home.how.step3.body',
              'Ξεκλειδώστε το group chat, ορίστε σημείο συνάντησης και απολαύστε την εμπειρία.',
            ),
          },
        ].map(({ step, title, body }) => (
          <div
            key={step}
            className={cn('p-4 rounded-xl border shadow-soft flex flex-col items-center text-center', tok.stepCard)}
          >
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2.5', tok.stepCircle)}>
              {step}
            </div>
            <h3 className={cn(HOME_TYPO.stepTitle, 'mb-1', tok.stepTitle)}>
              {title}
            </h3>
            <p className={cn(HOME_TYPO.stepBody, tok.stepBody)}>
              {body}
            </p>
          </div>
        ))}
      </section>

      <HomeFiltersSection
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        safetyFilter={safetyFilter}
        setSafetyFilter={setSafetyFilter}
        radiusFilter={radiusFilter}
        setRadiusFilter={setRadiusFilter}
        sortParam={sortParam}
        setSortParam={setSortParam}
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={() => setSeekingHostOnly((v) => !v)}
        showSeekingHostChip={seekingHostEvents.length > 0}
        hasActiveFilters={hasActiveFilters || seekingHostOnly}
        onClearAll={handleClearAll}
        onOpenMobileFilters={() => setFilterSheetOpen(true)}
        activeFilterCount={activeFilterCount}
        activeMood={activeMood}
        onSelectMood={handleSelectMood}
      />

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className={cn('flex p-1 rounded-lg w-fit', tok.feedTabWrap)}>
            <button
              onClick={() => setFeedType('For You')}
              className={cn('px-4 py-1.5 rounded-lg transition-all', HOME_TYPO.feedTab, feedType === 'For You' ? tok.feedTabActive : tok.feedTabInactive)}
            >
              {t('home.feed.for_you', 'Για Σένα')}
            </button>
            <button
              onClick={() => setFeedType('Discover')}
              className={cn('px-4 py-1.5 rounded-lg transition-all', HOME_TYPO.feedTab, feedType === 'Discover' ? tok.feedTabActive : tok.feedTabInactive)}
            >
              {t('home.feed.discover', 'Ανακάλυψε')}
            </button>
          </div>

          <div className={cn('flex p-0.5 rounded-lg w-fit', tok.mapBtnWrap)}>
            <button
              onClick={() => navigate('/nearby')}
              className={cn('p-1.5 rounded-lg transition-all', tok.mapBtn)}
              title={t('Άνοιγμα Χάρτη', 'Open Map')}
              aria-label={t('Άνοιγμα Χάρτη', 'Open Map')}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t(
                  'home.feed.no_events',
                  'Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.',
                )}
                description={t(
                  'Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία.',
                  'Try changing filters or category.',
                )}
                actionLabel={
                  hasActiveFilters || seekingHostOnly
                    ? t('Εκκαθάριση φίλτρων', 'Clear filters')
                    : undefined
                }
                onAction={
                  hasActiveFilters || seekingHostOnly ? handleClearAll : undefined
                }
              />
            </div>
          ) : (
            visibleEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))
          )}
        </div>

        {/* Load More Trigger */}
        {!isLoading && visibleEventsCount < sortedEvents.length && (
          <div ref={loadMoreRef} className="flex justify-center mt-6 py-4">
            <div className={cn('w-6 h-6 border-2 border-t-transparent rounded-full animate-spin', tok.spinner)} />
          </div>
        )}
      </section>

      <HomeMobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        activeCount={activeFilterCount}
        onClear={() => {
          handleClearAll();
          setFilterSheetOpen(false);
        }}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        radiusFilter={radiusFilter}
        setRadiusFilter={setRadiusFilter}
      />
    </div>
  );
}
