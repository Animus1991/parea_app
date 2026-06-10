import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { EventCard } from "../components/events/EventCard";
import { EventCardSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import {
  Search,
  ShieldCheck,
  Map as MapIcon,
  Grid,
  CheckCircle2,
  Users,
  CalendarX,
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { EventStories } from "../components/home/EventStories";
import { HomeBuddySeekStrip } from "../components/buddySeek/HomeBuddySeekStrip";
import { ActiveBuddiesRail } from "../components/home/ActiveBuddiesRail";
import { HomeQuickActions } from "../components/home/HomeQuickActions";
import { HomeHeroModeBar } from "../components/home/HomeHeroModeBar";
import { HomeThemedEnrichment } from "../components/home/HomeThemedEnrichment";
import { HomeThemedHeroSwitch } from "../components/home/HomeThemedHeroSwitch";
import { HomeFiltersSection } from "../components/home/HomeFiltersSection";
import { HomeMobileFilterSheet } from "../components/home/HomeMobileFilterSheet";
import { getTimeGreeting, getMotivation } from "../lib/homeGreeting";
import { getDefaultHomeSearchSuggestions } from "../lib/homeSearchSuggestions";
import { HomeSearchDropdown } from "../components/home/HomeSearchDropdown";
import { useStoryEvents } from "../hooks/useStoryEvents";
import { useHomeExternalEvents } from "../hooks/useHomeExternalEvents";
import { useHomeScrollToFilters } from "../hooks/useHomeScrollToFilters";
import { useHomeEventFeed } from "../hooks/useHomeEventFeed";
import { HOME_TYPO } from "../lib/homeTypography";
import { cn } from "../lib/utils";

export default function HomeNeonDark() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState<"For You" | "Discover">("For You");
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
  const firstName = currentUser?.name?.split(" ")[0] || t("φίλε", "there");
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
      setFeedType("Discover");
    }
  }, [initialSearch, searchQuery]);

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950 text-white p-6 md:p-10 rounded-[24px] shadow-sm relative overflow-hidden flex flex-col gap-4"
      >
        <HomeHeroModeBar className="relative z-10" />
        <div className="relative z-10 flex-1 w-full">
          <div className={cn("text-emerald-300 mb-4", HOME_TYPO.heroBadge)}>
            {t("home.hero.badge", "Νεος τροπος εξοδου")}
          </div>
          <h1 className={cn(HOME_TYPO.heroTitle, "mb-4 max-w-2xl")}>
            {t("home.hero.title1", "Βρείτε παρέα για τις")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
              {t("home.hero.title2", "εμπειρίες")}
            </span>{" "}
            {t("home.hero.title3", "που ήδη θέλετε να ζήσετε.")}
          </h1>
          <p className={cn("text-white max-w-xl mb-6", HOME_TYPO.heroSubtitle)}>
            {t(
              "home.hero.subtitle",
              "Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.",
            )}
          </p>

          <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 text-white mb-6", HOME_TYPO.heroStats)}>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-300" />{" "}
              {t("home.hero.stat1", "Μικρες ομαδες")}
            </span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />{" "}
              {t("home.hero.stat2", "Επαληθευμενη συμμετοχη")}
            </span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-emerald-300" />{" "}
              {t("home.hero.stat3", "Δημοσια σημεια")}
            </span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />{" "}
              {t("Ιδιωτικες αναφορες", "Private reports")}
            </span>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate("/nearby")}
              className={cn("flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl transition-colors", HOME_TYPO.heroMapBtn)}
              title={t("Εμφάνιση στον Χάρτη", "View on Map")}
            >
              <MapIcon className="w-4 h-4" />
              {t("Αναζήτηση στον Χάρτη", "Search on Map")}
            </button>
          </div>

          {/* Search with suggestions */}
          <div className="flex gap-3 items-center">
            <div ref={searchRef} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder={t(
                  "home.hero.search_placeholder",
                  "Αναζήτηση εμπειριών...",
                )}
                className="w-full h-11 pl-10 pr-4 rounded-full border-none bg-white/10 text-white placeholder-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 text-sm font-medium backdrop-blur-sm"
              />
              <HomeSearchDropdown
                popularSuggestions={searchSuggestions}
                onPick={(s) => { handleSearchChange(s); setShowSearchSuggestions(false); }}
                show={showSearchSuggestions}
                searchQuery={searchQuery}
              />
            </div>
            <button
              onClick={() => navigate("/trust")}
              className="hidden sm:flex items-center justify-center bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm text-white px-5 h-11 rounded-full text-xs font-bold transition-colors whitespace-nowrap"
            >
              {t("home.hero.how_groups", "Πώς λειτουργούν οι ομάδες")}
            </button>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      </motion.div>
        }
      />

      <EventStories events={storyEvents} />

      <HomeBuddySeekStrip />

      <HomeQuickActions onScrollToCategories={scrollToFilters} />
      <ActiveBuddiesRail />

      <HomeThemedEnrichment
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={() => setSeekingHostOnly((v) => !v)}
        onPreferDiscoverFeed={() => setFeedType("Discover")}
      />

      {/* How it works */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            step: "1",
            title: t("home.how.step1.title", "Διαλέξτε μια εμπειρία"),
            body: t(
              "home.how.step1.body",
              "Επιλέξτε μια εκδήλωση, πεζοπορία ή δραστηριότητα που θέλετε να παρακολουθήσετε.",
            ),
          },
          {
            step: "2",
            title: t("home.how.step2.title", "Εντάξτε μια μικρή ομάδα"),
            body: t(
              "home.how.step2.body",
              "Συνδεθείτε με 3-6 άτομα που μοιράζονται την ίδια πρόθεση και πρόγραμμα.",
            ),
          },
          {
            step: "3",
            title: t("home.how.step3.title", "Επιβεβαιώστε & συναντηθείτε"),
            body: t(
              "home.how.step3.body",
              "Ξεκλειδώστε το group chat, ορίστε σημείο συνάντησης και απολαύστε την εμπειρία.",
            ),
          },
        ].map(({ step, title, body }) => (
          <div
            key={step}
            className="bg-gray-800 p-4 rounded-xl border border-gray-800 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-8 h-8 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs mb-2.5">
              {step}
            </div>
            <h3 className={cn(HOME_TYPO.stepTitle, "text-white mb-1")}>
              {title}
            </h3>
            <p className={cn(HOME_TYPO.stepBody, "text-white")}>
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
          <div className="flex bg-gray-700 p-1 rounded-lg w-fit">
            <button
              onClick={() => setFeedType("For You")}
              className={cn("px-4 py-1.5 rounded-md transition-colors", HOME_TYPO.feedTab, feedType === "For You" ? "bg-gray-800 shadow-sm text-white" : "text-white hover:text-white")}
            >
              {t("home.feed.for_you", "Για Σένα")}
            </button>
            <button
              onClick={() => setFeedType("Discover")}
              className={cn("px-4 py-1.5 rounded-md transition-colors", HOME_TYPO.feedTab, feedType === "Discover" ? "bg-gray-800 shadow-sm text-white" : "text-white hover:text-white")}
            >
              {t("home.feed.discover", "Ανακάλυψε")}
            </button>
          </div>

          <div className="flex bg-gray-700 p-0.5 rounded-lg w-fit">
            <button className="p-1.5 rounded-md transition-colors bg-gray-800 shadow-sm text-white" aria-label={t('Προβολή πλέγματος', 'Grid view')} title={t('Προβολή πλέγματος', 'Grid view')}>
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/nearby")}
              className="p-1.5 rounded-md transition-colors text-white hover:text-white"
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
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarX}
                title={t(
                  "home.feed.no_events",
                  "Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.",
                )}
                description={t(
                  "Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία.",
                  "Try changing filters or category.",
                )}
                actionLabel={
                  hasActiveFilters || seekingHostOnly
                    ? t("Εκκαθάριση φίλτρων", "Clear filters")
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
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
