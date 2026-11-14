import { useState, useEffect, useRef } from "react";
import { CopilotInlinePrompt } from '../components/copilot/CopilotInlinePrompt';
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { EventCard } from "../components/events/EventCard";
import { EventCardSkeleton } from "../components/common/Skeleton";
import { Map as MapIcon, CalendarX } from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { EmptyState } from "../components/common/EmptyState";
import { useHomeTheme } from "../hooks/useHomeTheme";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { EventStories } from "../components/home/EventStories";
import { HomeLoggedInHero } from "../components/home/HomeLoggedInHero";
import { HomePendingFeedbackBanner } from "../components/home/HomePendingFeedbackBanner";
import { HomeBelowFold } from "../components/home/HomeBelowFold";
import { HomeBuddySeekStrip } from "../components/buddySeek/HomeBuddySeekStrip";
import { getTimeGreeting, getMotivation } from "../lib/homeGreeting";
import { getDefaultHomeSearchSuggestions } from "../lib/homeSearchSuggestions";
import { HomeSearchDropdown } from "../components/home/HomeSearchDropdown";
import { useStoryEvents } from "../hooks/useStoryEvents";
import { useHomeExternalEvents } from "../hooks/useHomeExternalEvents";
import { useHomeEventFeed } from "../hooks/useHomeEventFeed";
import { useHomeScrollToFilters } from "../hooks/useHomeScrollToFilters";
import { useOnboardingWelcome } from "../hooks/useOnboardingWelcome";
import { HomeOnboardingWelcomeBanner } from "../components/home/HomeOnboardingWelcomeBanner";
import { HomeFiltersSection } from "../components/home/HomeFiltersSection";
import { HomeMobileFilterSheet } from "../components/home/HomeMobileFilterSheet";
import { cn } from "../lib/utils";

export default function HomeClassic() {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [feedType, setFeedType] = useState<"For You" | "Discover">("For You");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [seekingHostOnly, setSeekingHostOnly] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useHomeExternalEvents();
  const scrollToFilters = useHomeScrollToFilters();
  const { showWelcome, dismissWelcome } = useOnboardingWelcome();
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
    isLoading,
    isError,
  } = feed;

  const currentUser = feed.currentUser;

  const handleClearAll = () => {
    clearAllFilters();
    setSeekingHostOnly(false);
  };

  const searchSuggestions = getDefaultHomeSearchSuggestions(t);

  // Sync to 'Discover' feed when the page is loaded with a search query
  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType("Discover");
    }
  }, [initialSearch, searchQuery]);

  useEffect(() => {
    if (showWelcome) setFeedType("Discover");
  }, [showWelcome]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [visibleEventsCount, setVisibleEventsCount] = useState(6);

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

      <EventStories events={storyEvents} />

      <CopilotInlinePrompt />

      <HomeBuddySeekStrip />

      {showWelcome && (
        <HomeOnboardingWelcomeBanner useClassicTokens onDismiss={dismissWelcome} />
      )}
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

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFeedType("For You")}
                className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 rounded-full ${feedType === "For You" ? h.feedTabActive : h.feedTabInactive}`}
              >
                {t("home.feed.for_you", "Για Σένα")}
              </button>
              <button
                onClick={() => setFeedType("Discover")}
                className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 rounded-full ${feedType === "Discover" ? h.feedTabActive : h.feedTabInactive}`}
              >
                {t("home.feed.discover", "Ανακάλυψε")}
              </button>
            </div>
            {!isLoading && sortedEvents.length > 0 && (
              <p className="text-xs font-semibold text-ink-muted">
                {sortedEvents.length === 1
                  ? t("1 αποτέλεσμα", "1 result")
                  : t(`${sortedEvents.length} αποτελέσματα`, `${sortedEvents.length} results`)}
              </p>
            )}
          </div>

          <div className={cn('flex p-0.5 rounded-full w-fit border', tok.isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-100')}>
            <button
              onClick={() => navigate("/nearby")}
              className={cn('p-1.5 rounded-lg transition-colors', h.feedTabInactive)}
              title={t("Άνοιγμα Χάρτη", "Open Map")}
              aria-label={t("Άνοιγμα Χάρτη", "Open Map")}
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
          ) : isError && sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t("Αδυναμία φόρτωσης εκδηλώσεων", "Could not load events")}
                description={t("Εμφανίζονται τα αποθηκευμένα δεδομένα όταν είναι διαθέσιμα.", "Cached data is shown when available.")}
              />
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t("home.feed.no_events", "Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.")}
                description={t('Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία.', 'Try changing filters or category.')}
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
      />
    </div>
  );
}
