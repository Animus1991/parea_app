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
import { HomeBelowFold } from "../components/home/HomeBelowFold";
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
    seekingHostOnly,
    setSeekingHostOnly,
    visibleEvents,
    hasMoreEvents,
    searchRef,
    loadMoreRef,
    scrollToFilters,
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

  useEffect(() => {
    if (showWelcome) setFeedType("Discover");
  }, [showWelcome, setFeedType]);

  const enrichment = <HomeDiscoverEnrichment storyEvents={storyEvents} />;

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
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-4">
              <EmptyState
                icon={CalendarX}
                title={t("home.feed.no_events", "Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.")}
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
              {enrichment}
            </div>
          ) : (
            visibleEvents.flatMap((event, index) => {
              const card = (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EventCard event={event} />
                </motion.div>
              );
              if (index !== 2) return [card];
              return [
                <div key="discover-enrichment" className="col-span-1 sm:col-span-2 lg:col-span-3">
                  {enrichment}
                </div>,
                card,
              ];
            })
          )}
        </div>

        {!isLoading && visibleEvents.length > 0 && visibleEvents.length < 3 && (
          <div className="mt-4">{enrichment}</div>
        )}

        {!isLoading && hasMoreEvents && (
          <div ref={loadMoreRef} className="flex justify-center mt-4 py-4">
            <div className={cn('w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin', tok.accentText)} />
          </div>
        )}
      </section>

      <HomeBelowFold
        useClassicTokens
        onScrollToCategories={scrollToFilters}
        seekingHostEvents={seekingHostEvents}
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={() => setSeekingHostOnly((v) => !v)}
        stepCardClass={h.card}
        stepCircleClass={h.stepBadge}
        stepTitleClass={h.stepTitle}
        stepBodyClass={h.stepBody}
      />

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
