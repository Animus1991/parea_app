import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { EventCard } from "../components/events/EventCard";
import { EventCardSkeleton } from "../components/common/Skeleton";
import { CalendarX } from "lucide-react";
import { EmptyState } from "../components/common/EmptyState";
import { useHomeTheme } from "../hooks/useHomeTheme";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { HomeLoggedInHero } from "../components/home/HomeLoggedInHero";
import { HomePendingFeedbackBanner } from "../components/home/HomePendingFeedbackBanner";
import { HomeVerifyBanner } from "../components/home/HomeVerifyBanner";
import { getTimeGreeting, getMotivation } from "../lib/homeGreeting";
import { HomeSearchDropdown } from "../components/home/HomeSearchDropdown";
import { useOnboardingWelcome } from "../hooks/useOnboardingWelcome";
import { HomeOnboardingWelcomeBanner } from "../components/home/HomeOnboardingWelcomeBanner";
import { HomeContinueStrip } from "../components/home/HomeContinueStrip";
import { HomeFiltersSection } from "../components/home/HomeFiltersSection";
import { HomeMobileFilterSheet } from "../components/home/HomeMobileFilterSheet";
import { HomeFeedToolbar } from "../components/home/HomeFeedToolbar";
import { HomeDiscoverEnrichment } from "../components/home/HomeDiscoverEnrichment";
import { useHomePageController } from "../hooks/useHomePageController";
import { cn } from "../lib/utils";
import { emptyHomeSchedule, isScheduleFilterActive } from "../lib/homeScheduleFilter";

export default function HomeClassic() {
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const { showWelcome, dismissWelcome } = useOnboardingWelcome();
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
    schedule,
    setSchedule,
    isLoading,
    isError,
    refetch,
  } = feed;

  const currentUser = feed.currentUser;

  useEffect(() => {
    if (showWelcome) setFeedType("Discover");
  }, [showWelcome, setFeedType]);

  return (
    <div className="space-y-4 md:space-y-5 pb-5 md:pb-0">
      <HomeLoggedInHero
        greeting={getTimeGreeting(currentUser?.name?.split(' ')[0] || t('φίλε', 'there'), t)}
        motivation={getMotivation(t)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchRef={searchRef}
        showSearchSuggestions={showSearchSuggestions}
        onSearchFocus={() => setShowSearchSuggestions(true)}
        searchDropdown={
          <HomeSearchDropdown
            popularSuggestions={searchSuggestions}
            onPick={(s) => {
              handleSearchChange(s);
              setShowSearchSuggestions(false);
            }}
            show={showSearchSuggestions}
            searchQuery={searchQuery}
          />
        }
      />

      <HomeContinueStrip />

      {showWelcome && (
        <HomeOnboardingWelcomeBanner useClassicTokens onDismiss={dismissWelcome} />
      )}
      <HomeVerifyBanner />
      <HomePendingFeedbackBanner />
      <HomeDiscoverEnrichment storyEvents={storyEvents} />

      <section>
        <HomeFeedToolbar
          feedType={feedType}
          setFeedType={setFeedType}
          resultCount={sortedEvents.length}
          isLoading={isLoading}
          tabClassName={(active) =>
            cn(
              'filter-chip px-4 text-xs font-bold transition-all duration-200 rounded-full',
              active ? h.feedTabActive : h.feedTabInactive,
            )
          }
          mapClassName={tok.isDark ? 'border-gray-600/50 text-gray-300' : 'border-gray-200 text-ink-muted'}
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
          schedule={schedule}
          setSchedule={setSchedule}
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
                title={t("Αδυναμία φόρτωσης εκδηλώσεων", "Could not load events")}
                description={t("Εμφανίζονται τα αποθηκευμένα δεδομένα όταν είναι διαθέσιμα.", "Cached data is shown when available.")}
                actionLabel={t("Επανάληψη", "Retry")}
                onAction={() => { void refetch(); }}
              />
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t("home.feed.no_events", "Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.")}
                description={
                  isScheduleFilterActive(schedule)
                    ? t(
                        'Καμία βραδιά δεν χωράει σε αυτές τις μέρες και ώρες. Διεύρυνε το πρόγραμμα — ο κατάλογος είναι ακόμα εκεί.',
                        'No nights fit these days and hours. Widen the schedule — the catalog is still there.',
                      )
                    : t(
                        'Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία — ή δες τι γίνεται κοντά σου.',
                        'Try changing filters or category — or see what’s nearby.',
                      )
                }
                actionLabel={
                  isScheduleFilterActive(schedule)
                    ? t('Διεύρυνε τις ώρες', 'Widen hours')
                    : hasActiveFilters || seekingHostOnly
                      ? t('Εκκαθάριση φίλτρων', 'Clear filters')
                      : t('Στον χάρτη', 'On the map')
                }
                onAction={
                  isScheduleFilterActive(schedule)
                    ? () => setSchedule(emptyHomeSchedule())
                    : hasActiveFilters || seekingHostOnly
                      ? handleClearAll
                      : () => navigate('/nearby')
                }
                secondaryLabel={
                  isScheduleFilterActive(schedule)
                    ? t('Εκκαθάριση φίλτρων', 'Clear filters')
                    : hasActiveFilters || seekingHostOnly
                      ? t('Στον χάρτη', 'On the map')
                      : t('Κατηγορίες', 'Categories')
                }
                onSecondary={
                  isScheduleFilterActive(schedule)
                    ? handleClearAll
                    : hasActiveFilters || seekingHostOnly
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
                'inline-flex min-h-8 items-center justify-center rounded-full border border-border bg-surface-raised px-4 text-xs font-bold',
                tok.accentText,
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
        schedule={schedule}
        setSchedule={setSchedule}
      />
    </div>
  );
}
