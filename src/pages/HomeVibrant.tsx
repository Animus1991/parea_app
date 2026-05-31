import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
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

export default function HomeVibrant() {
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
        className="bg-gradient-to-br from-[#7c3aed] via-[#db2777] to-[#f97316] text-white p-6 md:p-10 rounded-[24px] shadow-xl relative overflow-hidden flex flex-col gap-4"
      >
        <HomeHeroModeBar className="relative z-10" />
        <div className="relative z-10 flex-1 w-full">
          <div className="bg-white/20 backdrop-blur-sm text-white text-[14.21px] font-bold tracking-wide mb-4 px-3 py-1 rounded-full w-fit">
            {t("home.hero.badge", "Νεος τροπος εξοδου")}
          </div>
          <h1 className="text-[17.33px] md:text-[22.77px] font-bold tracking-tight mb-4 leading-[1.1] max-w-2xl">
            {t("home.hero.title1", "Βρείτε παρέα για τις")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100">
              {t("home.hero.title2", "εμπειρίες")}
            </span>{" "}
            {t("home.hero.title3", "που ήδη θέλετε να ζήσετε.")}
          </h1>
          <p className="text-white/90 font-medium text-[14.42px] md:text-[16.48px] leading-relaxed max-w-xl mb-6">
            {t(
              "home.hero.subtitle",
              "Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.",
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[11.33px] font-bold tracking-wide text-white/90 mb-6">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-200" />{" "}
              {t("home.hero.stat1", "Μικρες ομαδες")}
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />{" "}
              {t("home.hero.stat2", "Επαληθευμενη συμμετοχη")}
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-amber-200" />{" "}
              {t("home.hero.stat3", "Δημοσια σημεια")}
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />{" "}
              {t("Ιδιωτικες αναφορες", "Private reports")}
            </span>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate("/nearby")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-xl font-bold text-[13.58px] transition-colors backdrop-blur-sm"
              title={t("Εμφάνιση στον Χάρτη", "View on Map")}
            >
              <MapIcon className="w-4 h-4" />
              {t("Αναζήτηση στον Χάρτη", "Search on Map")}
            </button>
          </div>

          {/* Search with suggestions */}
          <div className="flex gap-3 items-center">
            <div ref={searchRef} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder={t(
                  "home.hero.search_placeholder",
                  "Αναζήτηση εμπειριών...",
                )}
                className="w-full h-11 pl-10 pr-4 rounded-full border border-white/20 bg-white/15 text-white placeholder-white/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60 text-sm font-medium backdrop-blur-sm"
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
              className="hidden sm:flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 h-11 rounded-full text-xs font-bold transition-colors whitespace-nowrap border border-white/20"
            >
              {t("home.hero.how_groups", "Πώς λειτουργούν οι ομάδες")}
            </button>
          </div>
        </div>
        {/* Decorative orbs */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/20 to-pink-500/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-gradient-to-tr from-violet-600/20 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      </motion.div>
        }
      />

      <EventStories events={storyEvents} />

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
            className="bg-white p-4 rounded-xl border border-fuchsia-100/60 shadow-sm flex flex-col items-center text-center hover:shadow-md hover:border-fuchsia-200/60 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-orange-400 text-white rounded-full flex items-center justify-center font-bold text-xs mb-2.5 shadow-sm">
              {step}
            </div>
            <h3 className="font-bold text-[#111827] text-[14.63px] mb-1">
              {title}
            </h3>
            <p className="text-[12.38px] leading-relaxed text-gray-600 font-medium">
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
      />

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex bg-fuchsia-50 p-1 rounded-lg w-fit border border-fuchsia-100">
            <button
              onClick={() => setFeedType("For You")}
              className={`px-4 py-1.5 rounded-md text-[12.73px] font-bold transition-all ${feedType === "For You" ? "bg-white shadow-sm text-fuchsia-700" : "text-gray-500 hover:text-fuchsia-600"}`}
            >
              {t("home.feed.for_you", "Για Σένα")}
            </button>
            <button
              onClick={() => setFeedType("Discover")}
              className={`px-4 py-1.5 rounded-md text-[12.73px] font-bold transition-all ${feedType === "Discover" ? "bg-white shadow-sm text-fuchsia-700" : "text-gray-500 hover:text-fuchsia-600"}`}
            >
              {t("home.feed.discover", "Ανακάλυψε")}
            </button>
          </div>

          <div className="flex bg-fuchsia-50 p-0.5 rounded-lg w-fit border border-fuchsia-100">
            <button className="p-1.5 rounded-md transition-all bg-white shadow-sm text-fuchsia-700" aria-label={t('Προβολή πλέγματος', 'Grid view')} title={t('Προβολή πλέγματος', 'Grid view')}>
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/nearby")}
              className="p-1.5 rounded-md transition-all text-gray-500 hover:text-fuchsia-600"
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
            <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
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
