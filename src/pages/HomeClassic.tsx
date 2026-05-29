import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import { motion } from "motion/react";
import { EventCard } from "../components/events/EventCard";
import { EventCardSkeleton } from "../components/common/Skeleton";
import {
  Search,
  ShieldCheck,
  Map as MapIcon,
  Grid,
  CheckCircle2,
  Users,
  ArrowDownUp,
  ChevronDown,
  X,
  Flame,
  Calendar,
  Trophy,
  Lightbulb,
  Crown,
} from "lucide-react";
import { parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";
import { useLanguage } from "../lib/i18n";
import { useGeolocation, haversineDistance } from "../hooks/useGeolocation";
import { useDebounce } from "../hooks/useDebounce";
import { FilterBottomSheet } from "../components/common/FilterBottomSheet";
import { EmptyState } from "../components/common/EmptyState";
import { CalendarX, SlidersHorizontal } from "lucide-react";
import { useHomeTheme } from "../hooks/useHomeTheme";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { EventStories } from "../components/home/EventStories";
import { cn } from "../lib/utils";

function getTimeGreeting(name: string, t: (gr: string, en: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t(`Καλημέρα, ${name} ☀️`, `Good morning, ${name} ☀️`);
  if (h < 17) return t(`Καλό απόγευμα, ${name} 🌤️`, `Good afternoon, ${name} 🌤️`);
  return t(`Καλό βράδυ, ${name} 🌙`, `Good evening, ${name} 🌙`);
}

function getMotivation(t: (gr: string, en: string) => string): string {
  const h = new Date().getHours();
  if (h < 9) return t('Νωρίς ξεκίνησε — νωρίς φτάνει!', 'Early start — great adventures await!');
  if (h < 12) return t('Τέλεια ώρα για να ανακαλύψεις νέες εμπειρίες.', 'Perfect time to discover new experiences.');
  if (h < 17) return t('Απογευματινή ενέργεια — κάνε την να μετράει.', 'Afternoon energy — make it count.');
  return t('Βραδινή έξοδος; Οι θρύλοι βγαίνουν αργά!', 'Evening plans? Legends go out after dark!');
}

const DAILY_TIPS_GR = [
  'Η αξιολόγησή σου μετά από μια εκδήλωση βοηθά την κοινότητα να αναπτυχθεί.',
  'Επιβεβαίωσε τη συμμετοχή σου 24 ώρες πριν για να διατηρήσεις την αξιοπιστία σου στο 100%.',
  'Μικρές ομάδες = βαθύτερες γνωριμίες. Δοκίμασε μια εκδήλωση με λιγότερα από 6 άτομα.',
  'Η επαλήθευση της ταυτότητάς σου ξεκλειδώνει προσβάσεις σε αποκλειστικές εμπειρίες.',
  'Πρότεινε μια εκδήλωση στους φίλους σου και διπλασίασε τη διασκέδαση!',
  'Συμμετοχή σε εκδηλώσεις διαφορετικών κατηγοριών αυξάνει τα XP σου ταχύτερα.',
];
const DAILY_TIPS_EN = [
  'Rating your experience after an event helps the community grow.',
  'Confirm attendance 24h before an event to keep your reliability at 100%.',
  'Small groups = deeper connections. Try an event with fewer than 6 people.',
  'Verifying your identity unlocks access to exclusive experiences.',
  'Suggest an event to your Nakamas and double the fun!',
  'Attending different event categories earns XP faster.',
];

export default function HomeClassic() {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const addRecentSearch = useStore((s) => s.addRecentSearch);
  const recentSearches = useStore((s) => s.recentSearches);

  // feedType declared first — used in the useEffect below
  const [feedType, setFeedType] = useState<"For You" | "Discover">("For You");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get("cat") || "All");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const events = useStore((state) => state.events);
  const feedbackSubmitted = useStore((state) => state.feedbackSubmitted);
  const groups = useStore((state) => state.groups);
  const fetchExternalEvents = useStore((state) => state.fetchExternalEvents);
  const geo = useGeolocation();

  useEffect(() => {
    fetchExternalEvents();
  }, [fetchExternalEvents]);

  const searchSuggestions = [
    t("Πεζοπορία", "Hiking"),
    t("Επιτραπέζια", "Board Games"),
    t("Μουσικά Φεστιβάλ", "Music Festivals"),
    t("Δικτύωση", "Networking"),
    t("Συναυλίες", "Concerts"),
    t("Σινεμά", "Cinema"),
  ];

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

  const [priceFilter, setPriceFilter] = useState<
    "All" | "Free" | "Paid" | "Group Discount"
  >(() => (searchParams.get("price") as "All" | "Free" | "Paid" | "Group Discount") || "All");
  const [dateFilter, setDateFilter] = useState<
    "Any" | "Today" | "This Week" | "This Month"
  >(() => (searchParams.get("date") as "Any" | "Today" | "This Week" | "This Month") || "Any");
  const [safetyFilter, setSafetyFilter] = useState<
    "All" | "low" | "medium" | "high_trust"
  >(() => (searchParams.get("safety") as "All" | "low" | "medium" | "high_trust") || "All");
  const [radiusFilter, setRadiusFilter] = useState<
    "Any" | "5km" | "10km" | "25km"
  >(() => (searchParams.get("dist") as "Any" | "5km" | "10km" | "25km") || "Any");
  const [tagFilter, setTagFilter] = useState<string>(() => searchParams.get("tag") || "All");
  const [seekingHostOnly, setSeekingHostOnly] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeCategory !== "All") params.set("cat", activeCategory);
    if (tagFilter !== "All") params.set("tag", tagFilter);
    if (priceFilter !== "All") params.set("price", priceFilter);
    if (dateFilter !== "Any") params.set("date", dateFilter);
    if (safetyFilter !== "All") params.set("safety", safetyFilter);
    if (radiusFilter !== "Any") params.set("dist", radiusFilter);
    setSearchParams(params, { replace: true });
    if (debouncedSearch.trim()) addRecentSearch(debouncedSearch.trim());
  }, [debouncedSearch, activeCategory, tagFilter, priceFilter, dateFilter, safetyFilter, radiusFilter, setSearchParams, addRecentSearch]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleEventsCount, setVisibleEventsCount] = useState(6);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    "All",
    "Live Music",
    "Electronic Music",
    "Theater & Dance",
    "Cinema",
    "Stand-up",
    "Food & Drink",
    "Museums",
    "Exhibitions",
    "Workshops",
    "Sports",
    "Social",
    "Networking",
    "Wellness",
    "Board games",
    "Book club",
    "Language exchange",
    "Hiking",
    "Nearby escapes",
    "Walking tours",
    "Community events",
  ];

  const categoryTranslations: Record<string, string> = {
    All: t("Όλα", "All"),
    "Live Music": t("Ζωντανή Μουσική", "Live Music"),
    "Electronic Music": t("Ηλεκτρονική Μουσική", "Electronic Music"),
    "Theater & Dance": t("Θέατρο & Χορός", "Theater & Dance"),
    Cinema: t("Σινεμά", "Cinema"),
    "Stand-up": "Stand-up",
    "Food & Drink": t("Φαγητό & Ποτό", "Food & Drink"),
    Museums: t("Μουσεία", "Museums"),
    Exhibitions: t("Εκθέσεις", "Exhibitions"),
    Workshops: t("Εργαστήρια", "Workshops"),
    Sports: t("Αθλητισμός", "Sports"),
    Social: t("Κοινωνικά", "Social"),
    Networking: t("Δικτύωση", "Networking"),
    Wellness: t("Ευεξία", "Wellness"),
    "Board games": t("Επιτραπέζια", "Board Games"),
    "Book club": t("Λέσχη Ανάγνωσης", "Book Club"),
    "Language exchange": t("Ανταλλαγή Γλωσσών", "Language Exchange"),
    Hiking: t("Πεζοπορία", "Hiking"),
    "Nearby escapes": t("Κοντινές Αποδράσεις", "Nearby Getaways"),
    "Walking tours": t("Ξεναγήσεις", "Walking Tours"),
    "Community events": t("Κοινότητα", "Community"),
  };

  const popularTags = [
    "All",
    "music",
    "culture",
    "food",
    "outdoor",
    "social",
    "nightlife",
    "sports",
    "workshop",
    "free",
  ];
  const tagTranslations: Record<string, string> = {
    All: t("Όλες οι Ετικέτες", "All Tags"),
    music: t("Μουσική", "Music"),
    culture: t("Πολιτισμός", "Culture"),
    food: t("Φαγητό", "Food"),
    outdoor: t("Υπαίθρια", "Outdoor"),
    social: t("Κοινωνικά", "Social"),
    nightlife: t("Νυχτερινή Ζωή", "Nightlife"),
    sports: t("Αθλητισμός", "Sports"),
    workshop: t("Εργαστήριο", "Workshop"),
    free: t("Δωρεάν", "Free"),
  };

  const mockDistances: Record<string, number> = {
    e1: 1.2, e2: 18.0, e3: 2.8, e4: 3.6, e5: 150.0, e6: 0.5,
    e7: 2.1, e8: 4.5, e9: 1.8, e10: 25.0, e11: 1.5, e12: 5.2,
    e13: 1.0, e14: 0.8, e15: 3.2, e16: 2.5, e17: 3.8, e18: 1.3,
    e19: 12.0, e20: 6.0, e21: 2.0, e22: 0.9, e23: 2.4, e24: 2.6,
    e25: 18.0, e26: 3.5, e27: 2.2, e28: 8.5,
  };

  const currentUser = useStore((state) => state.currentUser);

  const [tipIndex] = useState(() => Math.floor(Math.random() * DAILY_TIPS_GR.length));

  const eventsThisMonth = useMemo(() => {
    const userGroupIds = currentUser
      ? groups.filter(g => g.members.includes(currentUser.id)).map(g => g.eventId)
      : [];
    return events.filter(e => {
      if (!userGroupIds.includes(e.id)) return false;
      try { return isThisMonth(parseISO(e.date)); } catch { return false; }
    }).length;
  }, [groups, events, currentUser]);

  const totalEventsAttended = Object.keys(feedbackSubmitted).length;
  const currentStreak = Math.min(totalEventsAttended, 7);
  const xpTotal = totalEventsAttended * 50 + (currentUser?.reliabilityScore ?? 80);
  const communityLevel = Math.floor(xpTotal / 200) + 1;

  // Auto-request geolocation when radius filter is active
  useEffect(() => {
    if (radiusFilter !== 'Any' && !geo.granted && !geo.loading) {
      geo.request();
    }
  }, [radiusFilter, geo.granted, geo.loading]);

  const getDistance = (eventId: string, eventLat?: number, eventLng?: number): number | null => {
    if (!geo.granted || geo.lat == null || geo.lng == null) return null;
    if (eventLat != null && eventLng != null) {
      return haversineDistance(geo.lat, geo.lng, eventLat, eventLng);
    }
    return mockDistances[eventId] ?? null;
  };

  // Check for pending feedback
  const userGroupEventIds = currentUser
    ? groups.filter(g => g.members.includes(currentUser.id)).map(g => g.eventId)
    : [];
  const pendingFeedbackEvent = events.find(e => {
    if (!userGroupEventIds.includes(e.id)) return false;
    if (feedbackSubmitted[e.id]) return false;
    return new Date(e.date) < new Date();
  });

  // Platform-curated events that still have no group host — anyone can step up.
  const isSeekingHost = (e: (typeof events)[number]) =>
    !!e.isPlatformEvent && !groups.find((g) => g.eventId === e.id && g.hostId);
  const seekingHostEvents = useMemo(
    () => events.filter(isSeekingHost),
    [events, groups],
  );

  // Ordered list for the story rail: events seeking a host first, then trending,
  // then the rest — so the most actionable items lead the reel.
  const storyEvents = useMemo(() => {
    const rank = (e: (typeof events)[number]) =>
      isSeekingHost(e) ? 0 : e.isTrending ? 1 : 2;
    return [...events].sort(
      (a, b) =>
        rank(a) - rank(b) ||
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [events, groups]);

  const hasActiveFilters = activeCategory !== 'All' || tagFilter !== 'All' || priceFilter !== 'All' || dateFilter !== 'Any' || safetyFilter !== 'All' || radiusFilter !== 'Any' || searchQuery.length > 0 || seekingHostOnly;
  const activeFilterCount = [
    priceFilter !== 'All',
    dateFilter !== 'Any',
    safetyFilter !== 'All',
    radiusFilter !== 'Any',
    tagFilter !== 'All',
    seekingHostOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setActiveCategory('All');
    setTagFilter('All');
    setPriceFilter('All');
    setDateFilter('Any');
    setSafetyFilter('All');
    setRadiusFilter('Any');
    setSeekingHostOnly(false);
    handleSearchChange('');
  };

  // Memoized filtering
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = e.title.toLowerCase().includes(q);
        const inDesc = e.description?.toLowerCase().includes(q) ?? false;
        const inTags = (e.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(q),
        );
        if (!inTitle && !inDesc && !inTags) return false;
      }

      if (feedType === "For You") {
        const matchScore = currentUser
          ? (e.tags ?? []).filter((t) => (currentUser.interests || []).includes(t)).length
          : 0;
        if (matchScore === 0 && !e.isTrending && e.id.startsWith('tm_')) return false;
      }
      if (activeCategory !== "All" && e.category !== activeCategory)
        return false;
      if (tagFilter !== "All" && !(e.tags ?? []).includes(tagFilter))
        return false;
      if (priceFilter === "Free" && e.isPaid) return false;
      if (priceFilter === "Paid" && !e.isPaid) return false;
      if (priceFilter === "Group Discount" && !e.groupDiscount) return false;
      if (safetyFilter !== "All" && e.safetyLevel !== safetyFilter)
        return false;

      if (dateFilter !== "Any") {
        const eDate = parseISO(e.date);
        if (dateFilter === "Today" && !isToday(eDate)) return false;
        if (dateFilter === "This Week" && !isThisWeek(eDate)) return false;
        if (dateFilter === "This Month" && !isThisMonth(eDate)) return false;
      }

      if (radiusFilter !== "Any") {
        const distance = mockDistances[e.id] ?? 5;
        if (radiusFilter === "5km" && distance > 5) return false;
        if (radiusFilter === "10km" && distance > 10) return false;
        if (radiusFilter === "25km" && distance > 25) return false;
      }

      if (seekingHostOnly && !isSeekingHost(e)) return false;

      return true;
    });
  }, [
    events,
    groups,
    searchQuery,
    feedType,
    activeCategory,
    tagFilter,
    priceFilter,
    safetyFilter,
    currentUser,
    dateFilter,
    radiusFilter,
    seekingHostOnly,
  ]);

  // URL-based sorting (Relevance / Distance / Group Progress)
  const sortParam = searchParams.get("sort") || "Relevance";
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (sortParam === "Distance") {
        return (mockDistances[a.id] ?? 5) - (mockDistances[b.id] ?? 5);
      } else if (sortParam === "Group Progress") {
        const spacesA = (a.maxParticipants || 40) - 12;
        const spacesB = (b.maxParticipants || 40) - 12;
        return spacesA - spacesB;
      }

      // Default: Relevance (Match Score)
      const getMatchScore = (ev: (typeof events)[0]) => {
        if (!currentUser) return 0;
        const matchCount = (ev.tags ?? []).filter((t) =>
          (currentUser.interests || []).includes(t),
        ).length;
        return Math.min(
          99,
          45 + matchCount * 15 + (ev.category === "All" ? 0 : 10),
        );
      };

      if (sortParam === "Relevance" && currentUser) {
        return (
          getMatchScore(b) - getMatchScore(a) ||
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }

      // Chronological fallback
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredEvents, sortParam, currentUser]);

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
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`${h.hero} flex flex-col md:flex-row md:items-center justify-between gap-8`}
      >
        <div className="relative z-0 flex-1">
          <div className={`${h.heroGreeting} mb-1`}>
            {getTimeGreeting(currentUser?.name?.split(' ')[0] || t('φίλε', 'there'), t)}
          </div>
          <p className={`${h.heroMotivation} mb-4`}>{getMotivation(t)}</p>
          <h1 className={`${h.heroTitle} max-w-2xl`}>
            {t("home.hero.title1", "Βρείτε παρέα για τις")}{" "}
            <span className={h.heroTitleAccent}>
              {t("home.hero.title2", "εμπειρίες")}
            </span>{" "}
            {t("home.hero.title3", "που ήδη θέλετε να ζήσετε.")}
          </h1>
          <p className={`${h.heroSubtitle} max-w-xl mb-6`}>
            {t(
              "home.hero.subtitle",
              "Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.",
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {([
              { icon: Users, label: t("home.hero.stat1", "Μικρές ομάδες") },
              { icon: ShieldCheck, label: t("home.hero.stat2", "Επαληθευμένη συμμετοχή") },
              { icon: MapIcon, label: t("home.hero.stat3", "Δημόσια σημεία") },
              { icon: CheckCircle2, label: t("Ιδιωτικές αναφορές", "Private reports") },
            ] as const).map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] font-bold tracking-wide bg-white/10 border border-white/10 backdrop-blur-sm ${h.heroStat}`}
              >
                <Icon className={`w-3.5 h-3.5 ${h.heroStatIcon}`} />
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate("/nearby")}
              className="btn-gradient flex items-center gap-1.5 !rounded-xl !text-[12px] !px-3 !py-1.5"
              title={t("Εμφάνιση στον Χάρτη", "View on Map")}
            >
              <MapIcon className="w-3.5 h-3.5" />
              {t("Αναζήτηση στον Χάρτη", "Search on Map")}
            </button>
          </div>

          {/* Search with suggestions */}
          <div className="flex gap-3 items-center">
            <div ref={searchRef} className="relative flex-1 max-w-md">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 z-10 opacity-70`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder={t(
                  "home.hero.search_placeholder",
                  "Αναζήτηση εμπειριών...",
                )}
                className={`${h.heroSearchInput} text-sm font-medium shadow-soft focus:outline-none backdrop-blur-sm`}
              />
              {showSearchSuggestions && !searchQuery && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-soft-lg overflow-hidden ${h.heroSearchDropdown}`}>
                  <div className="px-3 pt-2 pb-1">
                    <span className={`text-[11px] font-bold tracking-widest ${h.heroSearchDropdownLabel}`}>
                      {t("Δημοφιλείς Αναζητήσεις", "Popular Searches")}
                    </span>
                  </div>
                  {searchSuggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleSearchChange(s);
                        setShowSearchSuggestions(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium flex items-center gap-2 ${h.heroSearchItem} ${h.heroSearchItemHover}`}
                    >
                      <Search className="w-3.5 h-3.5 opacity-60" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/trust")}
              className={`hidden sm:flex items-center justify-center text-xs font-bold transition-all duration-200 whitespace-nowrap ${h.heroOutlineBtn}`}
            >
              {t("home.hero.how_groups", "Πώς λειτουργούν οι ομάδες")}
            </button>
          </div>
        </div>
        {/* Decorative */}
        <div className={`absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br ${h.heroDecor} rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none`} />
      </motion.div>

      {/* ── Event Stories rail ── */}
      <EventStories events={storyEvents} />

      {/* ── Quick Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            {
              icon: Flame,
              label: t('Σερί', 'Streak'),
              value: `${currentStreak}`,
              unit: t('εβδ.', 'wks'),
              sub: t('Συνεχόμενες εβδομάδες', 'Consecutive weeks'),
              iconBg: h.statIconBg.streak,
              iconColor: h.statIconColor.streak,
            },
            {
              icon: Calendar,
              label: t('Αυτόν τον μήνα', 'This month'),
              value: `${eventsThisMonth}`,
              unit: t('εκδ.', 'events'),
              sub: t('Εκδηλώσεις που παρακολούθησες', 'Events attended'),
              iconBg: h.statIconBg.month,
              iconColor: h.statIconColor.month,
            },
            {
              icon: Trophy,
              label: t('Επίπεδο', 'Level'),
              value: `${communityLevel}`,
              unit: `${xpTotal} XP`,
              sub: t('Κατάταξη κοινότητας', 'Community rank'),
              iconBg: h.statIconBg.level,
              iconColor: h.statIconColor.level,
            },
          ] as const
        ).map(({ icon: Icon, label, value, unit, sub, iconBg, iconColor }) => (
          <div key={label} className={`rounded-2xl p-3.5 flex flex-col gap-1 ${h.card}`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${h.labelMuted}`}>{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-[22px] font-black leading-none tabular-nums ${h.statValue}`}>{value}</span>
              <span className={`text-[10px] font-semibold ${h.statUnit}`}>{unit}</span>
            </div>
            <span className={`text-[10px] font-medium leading-tight ${h.labelMuted}`}>{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Daily Tip Banner ── */}
      <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 ${h.tipBanner}`}>
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest block mb-0.5 ${h.tipLabel}`}>{t('Συμβουλή Ημέρας', 'Tip of the Day')}</span>
          <p className={`text-[12.5px] font-medium leading-relaxed ${h.tipBody}`}>{t(DAILY_TIPS_GR[tipIndex], DAILY_TIPS_EN[tipIndex])}</p>
        </div>
      </div>

      {/* Pending Feedback Alert */}
      {pendingFeedbackEvent && (
      <section className={`rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft ${h.feedbackBanner}`}>
        <div className="flex gap-3 items-center">
          <div className={`p-2 text-amber-600 rounded-full shadow-soft shrink-0 ${tok.isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-[14.63px] font-bold ${h.feedbackTitle}`}>
              {t("Εκκρεμής Αξιολόγηση", "Pending Feedback")}
            </h3>
            <p className={`text-[11.33px] font-medium mt-0.5 leading-relaxed ${h.feedbackBody}`}>
              {t(
                `Αξιολογήστε τα μέλη από το "${pendingFeedbackEvent.title}" για να ξεκλειδώσετε την επόμενη κράτησή σας.`,
                `Rate the members from "${pendingFeedbackEvent.title}" to unlock your next booking.`,
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/history/feedback/${pendingFeedbackEvent.id}`)}
          className={`text-[12.38px] tracking-wider font-bold px-4 py-2 rounded-full whitespace-nowrap w-full sm:w-auto shadow-soft transition-all duration-200 ${h.feedbackBtn}`}
        >
          {t("Αξιολόγηση", "Rate Now")}
        </button>
      </section>
      )}

      {/* Platform events seeking an organizer */}
      {seekingHostEvents.length > 0 && (
        <section className={`rounded-2xl p-4 space-y-3.5 border ${tok.isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/70 border-amber-200/70'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h2 className={`text-[14.63px] font-bold leading-tight ${h.heading}`}>
                  {t('Αναζητούν διοργανωτή', 'Looking for an organizer')}
                </h2>
                <p className={`text-[12px] font-medium mt-0.5 ${h.labelMuted}`}>
                  {t(
                    'Εκδηλώσεις από το Nakamas — γίνε εσύ ο διοργανωτής της παρέας.',
                    'Events by Nakamas — step up and organize the group.',
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSeekingHostOnly((v) => !v)}
              className={`shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${seekingHostOnly ? h.chipActive : h.chipInactive}`}
            >
              {seekingHostOnly ? t('Όλες οι εκδηλώσεις', 'All events') : `${t('Δες όλες', 'See all')} (${seekingHostEvents.length})`}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar">
            {seekingHostEvents.map((event) => (
              <div key={event.id} className="w-[290px] sm:w-[320px] shrink-0">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </section>
      )}

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
            className={`p-5 rounded-2xl shadow-soft flex flex-col items-center text-center ${h.card}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2.5 ${h.stepBadge}`}>
              {step}
            </div>
            <h3 className={`font-bold text-[14.63px] mb-1 ${h.stepTitle}`}>
              {title}
            </h3>
            <p className={`text-[12.38px] leading-relaxed font-medium ${h.stepBody}`}>
              {body}
            </p>
          </div>
        ))}
      </section>

      {/* Categories & Filters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-[11.6px] font-bold tracking-wide ${h.sectionLabel}`}>
            {t("home.explore_categories", "Εξερευνηση κατηγοριων")}
          </h2>
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-full text-[12px] font-bold shadow-soft ${h.filterBtn}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('Φίλτρα', 'Filters')}
            {activeFilterCount > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${h.filterBadge}`}>{activeFilterCount}</span>
            )}
          </button>
        </div>
        <div>
          <div ref={categoryScrollRef} className="flex flex-nowrap gap-2 overflow-x-auto pb-1 noscrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[12.75px] font-bold shadow-soft transition-all duration-200 tracking-wide ${
                  activeCategory === cat ? h.chipActive : h.chipInactive
                }`}
              >
                {categoryTranslations[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar">
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[11.82px] font-bold transition-all duration-200 border ${
                tagFilter === tag ? h.tagActive : h.tagInactive
              }`}
            >
              {tagTranslations[tag] ?? tag}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar items-center flex-wrap">
          <select
            className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
            value={priceFilter}
            onChange={(e) =>
              setPriceFilter(e.target.value as typeof priceFilter)
            }
          >
            <option value="All">
              {t("home.filter.all_types", "Όλοι οι Τύποι")}
            </option>
            <option value="Free">{t("home.filter.free", "Δωρεάν")}</option>
            <option value="Paid">{t("home.filter.paid", "Επί Πληρωμή")}</option>
            <option value="Group Discount">
              {t("home.filter.group_discount", "Ομαδική Έκπτωση")}
            </option>
          </select>

          <select
            className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          >
            <option value="Any">
              {t("home.filter.any_date", "Οποιαδήποτε Ημ/νία")}
            </option>
            <option value="Today">{t("home.filter.today", "Σήμερα")}</option>
            <option value="This Week">
              {t("home.filter.this_week", "Αυτή την Εβδομάδα")}
            </option>
            <option value="This Month">
              {t("home.filter.this_month", "Αυτόν τον Μήνα")}
            </option>
          </select>

          <select
            className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
            value={safetyFilter}
            onChange={(e) =>
              setSafetyFilter(e.target.value as typeof safetyFilter)
            }
          >
            <option value="All">
              {t("home.filter.all_comfort", "Όλα τα Επίπεδα")}
            </option>
            <option value="low">
              {t("home.filter.public", "Δημόσιοι Χώροι")}
            </option>
            <option value="medium">
              {t("home.filter.organized", "Οργανωμένοι Hosts")}
            </option>
            <option value="high_trust">
              {t("home.filter.verified", "Επαληθευμένες Ομάδες")}
            </option>
          </select>

          <select
            className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
            value={radiusFilter}
            onChange={(e) =>
              setRadiusFilter(e.target.value as typeof radiusFilter)
            }
          >
            <option value="Any">
              {t("home.filter.any_distance", "Οποιαδήποτε Απόσταση")}
            </option>
            <option value="5km">{t("home.filter.5km", "Εντός 5χλμ")}</option>
            <option value="10km">{t("home.filter.10km", "Εντός 10χλμ")}</option>
            <option value="25km">{t("home.filter.25km", "Εντός 25χλμ")}</option>
          </select>

          {seekingHostEvents.length > 0 && (
            <button
              type="button"
              onClick={() => setSeekingHostOnly((v) => !v)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1 rounded-full text-[11.82px] font-bold transition-all duration-200 border ${seekingHostOnly ? h.tagActive : h.tagInactive}`}
            >
              <Crown className="w-3.5 h-3.5" />
              {t("Χωρίς διοργανωτή", "Seeking organizer")}
            </button>
          )}

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              className={`text-[12.73px] pl-7 pr-3 font-medium outline-none cursor-pointer appearance-none transition-all duration-200 ${h.select}`}
              value={sortParam}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                p.set("sort", e.target.value);
                setSearchParams(p);
              }}
            >
              <option value="Relevance">
                {t("home.feed.sort.relevance", "Συνάφεια")}
              </option>
              <option value="Distance">
                {t("home.feed.sort.distance", "Απόσταση")}
              </option>
              <option value="Group Progress">
                {t("home.feed.sort.group_progress", "Πρόοδος Ομάδας")}
              </option>
            </select>
            <ArrowDownUp className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60 ${h.labelMuted}`} />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11.82px] font-bold text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              {t("Καθαρισμός", "Clear")}
            </button>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFeedType("For You")}
              className={`px-4 py-1.5 text-[12.73px] font-bold transition-all duration-200 rounded-full ${feedType === "For You" ? h.feedTabActive : h.feedTabInactive}`}
            >
              {t("home.feed.for_you", "Για Σένα")}
            </button>
            <button
              onClick={() => setFeedType("Discover")}
              className={`px-4 py-1.5 text-[12.73px] font-bold transition-all duration-200 rounded-full ${feedType === "Discover" ? h.feedTabActive : h.feedTabInactive}`}
            >
              {t("home.feed.discover", "Ανακάλυψε")}
            </button>
          </div>

          <div className={cn('flex p-0.5 rounded-full w-fit border', tok.isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-100')}>
            <button className={cn('p-1.5 rounded-full transition-all duration-200 shadow-soft', tok.isDark ? 'bg-gray-700 text-white' : 'bg-white', h.heading)} aria-label={t('Προβολή πλέγματος', 'Grid view')} title={t('Προβολή πλέγματος', 'Grid view')}>
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/nearby")}
              className={cn('p-1.5 rounded-md transition-colors', h.feedTabInactive)}
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
                title={t("home.feed.no_events", "Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.")}
                description={t('Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία.', 'Try changing filters or category.')}
                actionLabel={hasActiveFilters ? t('Εκκαθάριση φίλτρων', 'Clear filters') : undefined}
                onAction={hasActiveFilters ? clearAllFilters : undefined}
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
            <div className={cn('w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin', tok.accentText)} />
          </div>
        )}
      </section>

      <FilterBottomSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        activeCount={activeFilterCount}
        onClear={() => { clearAllFilters(); setFilterSheetOpen(false); }}
      >
        <div className="space-y-4">
          <div>
            <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Τιμή', 'Price')}</p>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Free', 'Paid', 'Group Discount'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPriceFilter(p)} className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${priceFilter === p ? h.chipActive : h.chipInactive}`}>
                  {p === 'All' ? t('Όλα', 'All') : p === 'Free' ? t('Δωρεάν', 'Free') : p === 'Paid' ? t('Επί πληρωμή', 'Paid') : t('Ομαδική έκπτωση', 'Group discount')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Ημερομηνία', 'Date')}</p>
            <div className="flex flex-wrap gap-2">
              {(['Any', 'Today', 'This Week', 'This Month'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDateFilter(d)} className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${dateFilter === d ? h.chipActive : h.chipInactive}`}>
                  {d === 'Any' ? t('Οποτεδήποτε', 'Any') : d === 'Today' ? t('Σήμερα', 'Today') : d === 'This Week' ? t('Αυτή την εβδομάδα', 'This week') : t('Αυτόν τον μήνα', 'This month')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Απόσταση', 'Distance')}</p>
            <div className="flex flex-wrap gap-2">
              {(['Any', '5km', '10km', '25km'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRadiusFilter(r)} className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${radiusFilter === r ? h.chipActive : h.chipInactive}`}>
                  {r === 'Any' ? t('Οποιαδήποτε', 'Any') : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterBottomSheet>
    </div>
  );
}
