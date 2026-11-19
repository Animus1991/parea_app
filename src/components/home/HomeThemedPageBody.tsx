import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { EventCard } from '../events/EventCard';
import { EventCardSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { CalendarX } from 'lucide-react';
import { HomeThemedEnrichment } from './HomeThemedEnrichment';
import { HomeContinueStrip } from './HomeContinueStrip';
import { HomeThemedHeroSwitch } from './HomeThemedHeroSwitch';
import { HomeRichHero } from './HomeRichHero';
import { HomeFiltersSection } from './HomeFiltersSection';
import { HomeMobileFilterSheet } from './HomeMobileFilterSheet';
import { HomeFeedToolbar } from './HomeFeedToolbar';
import { HomeDiscoverEnrichment } from './HomeDiscoverEnrichment';
import { getTimeGreeting, getMotivation } from '../../lib/homeGreeting';
import { useHomePageController } from '../../hooks/useHomePageController';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { HOME_THEMED_TOKENS, type HomeThemedVariant } from '../../lib/homeThemedTokens';
import { cn } from '../../lib/utils';

/**
 * Canonical themed Home — ONE implementation for vibrant/neon/bento × light/dark.
 * Shared feed/search/filter state lives in useHomePageController (with HomeClassic).
 */
export default function HomeThemedPageBody({ variant }: { variant: HomeThemedVariant }) {
  const tok = HOME_THEMED_TOKENS[variant];
  const navigate = useNavigate();
  const ctrl = useHomePageController();
  const {
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
    storyEvents,
    seekingHostEvents,
    feed,
    searchSuggestions,
    handleClearAll,
    searchQuery,
    handleSearchChange,
  } = ctrl;

  const {
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
    activeMood,
    handleSelectMood,
    isLoading,
    isError,
    refetch,
  } = feed;

  const currentUser = feed.currentUser;
  const firstName = currentUser?.name?.split(' ')[0] || t('φίλε', 'there');
  const greeting = getTimeGreeting(firstName, t);
  const motivation = getMotivation(t);
  return (
    <div className="space-y-4 md:space-y-5 pb-5 md:pb-0">
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

      <HomeContinueStrip />

      <HomeThemedEnrichment onPreferDiscoverFeed={() => setFeedType('Discover')} />
      <HomeDiscoverEnrichment storyEvents={storyEvents} />

      <section>
        <HomeFeedToolbar
          feedType={feedType}
          setFeedType={setFeedType}
          resultCount={sortedEvents.length}
          isLoading={isLoading}
          tabWrapClassName={cn('p-1 rounded-lg w-fit', tok.feedTabWrap)}
          tabClassName={(active) =>
            cn(
              HOME_TYPO.filterChip,
              'px-4 rounded-lg transition-all',
              HOME_TYPO.feedTab,
              active ? tok.feedTabActive : tok.feedTabInactive,
            )
          }
          mapClassName={tok.mapBtn}
          filtersOpen={filtersOpen}
          onToggleFilters={toggleFilters}
          activeFilterCount={activeFilterCount + (seekingHostOnly ? 1 : 0)}
        />

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
          activeMood={activeMood}
          onSelectMood={handleSelectMood}
          expanded={filtersExpanded}
        />


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : isError && sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t('Αδυναμία φόρτωσης εκδηλώσεων', 'Could not load events')}
                description={t('Εμφανίζονται τα αποθηκευμένα δεδομένα όταν είναι διαθέσιμα.', 'Cached data is shown when available.')}
                actionLabel={t('Επανάληψη', 'Retry')}
                onAction={() => { void refetch(); }}
              />
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t(
                  'home.feed.no_events',
                  'Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.',
                )}
                description={t(
                  'Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία — ή δες τι γίνεται κοντά σου.',
                  'Try changing filters or category — or see what’s nearby.',
                )}
                actionLabel={
                  hasActiveFilters || seekingHostOnly
                    ? t('Εκκαθάριση φίλτρων', 'Clear filters')
                    : t('Στον χάρτη', 'On the map')
                }
                onAction={
                  hasActiveFilters || seekingHostOnly
                    ? handleClearAll
                    : () => navigate('/nearby')
                }
                secondaryLabel={
                  hasActiveFilters || seekingHostOnly
                    ? t('Στον χάρτη', 'On the map')
                    : t('Κατηγορίες', 'Categories')
                }
                onSecondary={
                  hasActiveFilters || seekingHostOnly
                    ? () => navigate('/nearby')
                    : () => navigate('/categories')
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

        {!isLoading && hasMoreEvents && (
          <div ref={loadMoreRef} className="flex justify-center mt-4 py-4">
            <button
              type="button"
              onClick={loadMoreEvents}
              className={cn(
                'inline-flex min-h-8 items-center justify-center rounded-full border px-4 text-xs font-bold',
                tok.mapBtn,
              )}
            >
              {t('Φόρτωσε περισσότερα', 'Load more')}
            </button>
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
        safetyFilter={safetyFilter}
        setSafetyFilter={setSafetyFilter}
        sortParam={sortParam}
        setSortParam={setSortParam}
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={() => setSeekingHostOnly((v) => !v)}
        showSeekingHostChip={seekingHostEvents.length > 0}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        activeMood={activeMood}
        onSelectMood={handleSelectMood}
      />
    </div>
  );
}
