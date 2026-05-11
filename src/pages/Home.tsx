import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { EventCard } from '../components/events/EventCard';
import { EventCardSkeleton } from '../components/common/Skeleton';
import { Search, ShieldCheck, Map as MapIcon, Grid, CheckCircle2, Users, ArrowDownUp, ChevronDown } from 'lucide-react';
import { parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useLanguage } from '../lib/i18n';
import { cn } from '../lib/utils';

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Category horizontal scroll + drag
  const catScrollRef = useRef<HTMLDivElement>(null);
  const catDragging = useRef(false);
  const catStartX = useRef(0);
  const catScrollLeft = useRef(0);
  const catDragged = useRef(false);

  // Attach wheel listener as non-passive so preventDefault works
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleCatMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!catScrollRef.current) return;
    catDragging.current = true;
    catDragged.current = false;
    catStartX.current = e.pageX - catScrollRef.current.offsetLeft;
    catScrollLeft.current = catScrollRef.current.scrollLeft;
  }, []);

  const handleCatMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!catDragging.current || !catScrollRef.current) return;
    const x = e.pageX - catScrollRef.current.offsetLeft;
    const walk = x - catStartX.current;
    if (Math.abs(walk) > 4) catDragged.current = true;
    catScrollRef.current.scrollLeft = catScrollLeft.current - walk;
  }, []);

  const handleCatMouseUp = useCallback(() => {
    catDragging.current = false;
  }, []);

  const searchSuggestions = [
    t(`Πεζοπορία`, `Hiking`),
    t(`Επιτραπέζια`, `Board Games`),
    t(`Μουσικά Φεστιβάλ`, `Music Festivals`),
    t(`Δικτύωση`, `Networking`),
    t(`Συναυλίες`, `Concerts`),
    t(`Σινεμά`, `Cinema`),
  ];

  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType('Discover');
    }
  }, [initialSearch, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid' | 'Group Discount'>('All');
  const [dateFilter, setDateFilter] = useState<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
  const [safetyFilter, setSafetyFilter] = useState<'All' | 'low' | 'medium' | 'high_trust'>('All');
  const [radiusFilter, setRadiusFilter] = useState<'Any' | '5km' | '10km' | '25km'>('Any');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleEventsCount, setVisibleEventsCount] = useState(6);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    'All', 'Theatre', 'Concerts', 'Cinema', 'Stand-up', 'Museums',
    'Exhibitions', 'Festivals', 'Board games', 'Book clubs', 'Language exchange',
    'Philosophy/Science', 'City walks', 'Hiking', 'Nearby escapes',
    'Short day trips', 'Nature walks', 'Light sports', 'Workshops',
    'Online events', 'Community events', 'Private events',
  ];

  const categoryTranslations: Record<string, string> = {
    'All': t(`Όλα`, `All`), 'Theatre': t(`Θέατρο`, `Theatre`), 'Concerts': t(`Συναυλίες`, `Concerts`),
    'Cinema': t(`Σινεμά`, `Cinema`), 'Stand-up': 'Stand-up', 'Museums': t(`Μουσεία`, `Museums`),
    'Exhibitions': t(`Εκθέσεις`, `Exhibitions`), 'Festivals': t(`Φεστιβάλ`, `Festivals`),
    'Board games': t(`Επιτραπέζια`, `Board Games`), 'Book clubs': t(`Λέσχη Ανάγνωσης`, `Book Club`),
    'Language exchange': t(`Ανταλλαγή Γλωσσών`, `Language Exchange`),
    'Philosophy/Science': t(`Φιλοσοφία/Επιστήμη`, `Philosophy/Science`),
    'City walks': t(`Περίπατοι`, `City Walks`), 'Hiking': t(`Πεζοπορία`, `Hiking`),
    'Nearby escapes': t(`Κοντινές Αποδράσεις`, `Nearby Getaways`),
    'Short day trips': t(`Μονοήμερες`, `Day Trips`), 'Nature walks': t(`Βόλτες στη Φύση`, `Nature Walks`),
    'Light sports': t(`Ελαφριά Άθληση`, `Light Sports`), 'Workshops': t(`Εργαστήρια`, `Workshops`),
    'Online events': t(`Διαδικτυακά`, `Online`), 'Community events': t(`Κοινότητα`, `Community`),
    'Private events': t(`Ιδιωτικά`, `Private`),
  };

  const popularTags = ['All', 'music', 'networking', 'outdoor', 'indoor', 'social', 'learning', 'sports'];
  const tagTranslations: Record<string, string> = {
    'All': t(`Όλες οι Ετικέτες`, `All Tags`),
    'music': t(`Μουσική`, `Music`),
    'networking': t(`Δικτύωση`, `Networking`),
    'outdoor': t(`Υπαίθρια`, `Outdoor`),
    'indoor': t(`Εσωτερικός Χώρος`, `Indoor`),
    'social': t(`Κοινωνικά`, `Social`),
    'learning': t(`Εκμάθηση`, `Learning`),
    'sports': t(`Αθλητισμός`, `Sports`),
  };

  const mockDistances: Record<string, number> = {
    'e1': 1.2, 'e2': 18.0, 'e3': 2.8, 'e4': 3.6, 'e5': 150.0, 'e6': 0.5,
  };

  const filteredEvents = useMemo(() => {
    return mockEvents.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = e.title.toLowerCase().includes(q);
        const inDesc = e.description?.toLowerCase().includes(q) ?? false;
        const inTags = (e.tags ?? []).some(tag => tag.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) return false;
      }
      if (feedType === 'For You' && !['e4', 'e1', 'e2', 'e5'].includes(e.id)) return false;
      if (activeCategory !== 'All' && e.category !== activeCategory) return false;
      if (tagFilter !== 'All' && !(e.tags ?? []).includes(tagFilter)) return false;
      if (priceFilter === 'Free' && e.isPaid) return false;
      if (priceFilter === 'Paid' && !e.isPaid) return false;
      if (priceFilter === 'Group Discount' && !e.groupDiscount) return false;
      if (safetyFilter !== 'All' && e.safetyLevel !== safetyFilter) return false;

      if (dateFilter !== 'Any') {
        const eDate = parseISO(e.date);
        if (dateFilter === 'Today' && !isToday(eDate)) return false;
        if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
        if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
      }

      if (radiusFilter !== 'Any') {
        const distance = mockDistances[e.id] ?? 5;
        if (radiusFilter === '5km' && distance > 5) return false;
        if (radiusFilter === '10km' && distance > 10) return false;
        if (radiusFilter === '25km' && distance > 25) return false;
      }

      return true;
    });
  }, [searchQuery, feedType, activeCategory, tagFilter, priceFilter, safetyFilter, dateFilter, radiusFilter]);

  const sortParam = searchParams.get('sort') || 'Relevance';
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (sortParam === 'Distance') {
        return (mockDistances[a.id] ?? 5) - (mockDistances[b.id] ?? 5);
      } else if (sortParam === 'Group Progress') {
        const spacesA = (a.maxParticipants || 40) - 12;
        const spacesB = (b.maxParticipants || 40) - 12;
        return spacesA - spacesB;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredEvents, sortParam]);

  const visibleEvents = sortedEvents.slice(0, visibleEventsCount);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t(`Καλημέρα`, `Good morning`);
    if (hour < 18) return t(`Καλό απόγευμα`, `Good afternoon`);
    return t(`Καλό βράδυ`, `Good evening`);
  };

  return (
    <div className="space-y-5 pb-10 md:pb-0">
      {/* Personalized greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">{getGreeting()}, Alex! 👋</h2>
          <p className="text-[12.5px] text-gray-500 font-medium">{t(`Ας βρούμε την επόμενη εμπειρία σου`, `Let's find your next experience`)}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full animate-pulse" style={{ animationDuration: '3s' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[11.2px] font-bold text-red-700">3 {t(`τώρα live`, `happening now`)}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[#111827] text-white p-5 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-[#18D8DB] border border-[#18D8DB]/30 bg-[#18D8DB]/10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3">
            {t('home.hero.badge', 'Νέος Τρόπος Εξόδου')}
          </div>
          <h1 className="text-[20.9px] md:text-[2.09rem] font-bold tracking-tight mb-3 leading-[1.1] max-w-2xl">
            {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#18D8DB] to-cyan-400">
              {t('home.hero.title2', 'εμπειρίες')}
            </span>{' '}
            {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
          </h1>
          <p className="text-gray-400 font-medium text-[12px] md:text-sm leading-relaxed max-w-xl mb-5">
            {t('home.hero.subtitle', 'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.')}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] uppercase font-bold tracking-wider text-gray-300 mb-5">
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#18D8DB]" /> {t('home.hero.stat1', 'Μικρές ομάδες')}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#18D8DB]" /> {t('home.hero.stat2', 'Επαληθευμένη συμμετοχή')}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1"><MapIcon className="w-3 h-3 text-[#18D8DB]" /> {t('home.hero.stat3', 'Δημόσια σημεία')}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#18D8DB]" /> {t(`Ιδιωτικές αναφορές`, `Private reports`)}</span>
          </div>

          {/* Search with suggestions */}
          <div className="flex gap-2 items-center">
            <div ref={searchRef} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder={t('home.hero.search_placeholder', 'Αναζήτηση εμπειριών...')}
                className="w-full h-9 pl-9 pr-4 rounded-full border-none bg-white/10 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#18D8DB]/60 text-[13.8px] font-medium backdrop-blur-sm"
              />
              {showSearchSuggestions && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[11.2px] font-bold text-gray-400 uppercase tracking-widest">{t(`Δημοφιλείς Αναζητήσεις`, `Popular Searches`)}</span>
                  </div>
                  {searchSuggestions.map(s => (
                    <button
                      key={s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { handleSearchChange(s); setShowSearchSuggestions(false); }}
                      className="w-full text-left px-4 py-2 text-[13.8px] text-gray-700 hover:bg-cyan-50 hover:text-[#0E8B8D] transition-colors font-medium flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-gray-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/trust')}
              className="hidden sm:flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 h-9 rounded-full text-[12.5px] font-bold transition-colors whitespace-nowrap"
            >
              {t(`Πώς λειτουργούν οι ομάδες`, `How groups work`)}
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      </div>

      {/* Active Now + Community Stats */}
      <section className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[12.5px] font-bold text-[#111827]">127 {t(`online τώρα`, `active now`)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
          <Users className="w-3 h-3 text-cyan-600" />
          <span className="text-[12.5px] font-bold text-gray-600">2,340 {t(`μέλη`, `members`)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
          <Grid className="w-3 h-3 text-cyan-600" />
          <span className="text-[12.5px] font-bold text-gray-600">48 {t(`εκδηλώσεις αυτή τη βδομάδα`, `events this week`)}</span>
        </div>
      </section>

      {/* Pending Feedback Alert */}
      <section className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-3 items-center">
          <div className="bg-white p-1.5 text-amber-500 rounded-full shadow-sm shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#111827]">{t('home.pending_feedback.title', 'Εκκρεμής Αξιολόγηση')}</h3>
            <p className="text-[12.5px] text-gray-600 font-medium mt-0.5 leading-relaxed">{t('home.pending_feedback.body', 'Αξιολογήστε τα 3 μέλη από το "Comedy Night" για να ξεκλειδώσετε την επόμενη κράτησή σας.')}</p>
          </div>
        </div>
        <button onClick={() => navigate('/plans')} className="text-[11.875px] uppercase tracking-wider font-bold bg-[#111827] text-white px-3.5 py-1.5 rounded-full whitespace-nowrap hover:bg-black w-full sm:w-auto shadow-sm transition-colors">
          {t('home.pending_feedback.cta', 'Αξιολόγηση')}
        </button>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: '1', title: t('home.how.step1.title', 'Διαλέξτε μια εμπειρία'), body: t('home.how.step1.body', 'Επιλέξτε μια εκδήλωση, πεζοπορία ή δραστηριότητα που θέλετε να παρακολουθήσετε.') },
          { step: '2', title: t('home.how.step2.title', 'Εντάξτε μια μικρή ομάδα'), body: t('home.how.step2.body', 'Συνδεθείτε με 3-6 άτομα που μοιράζονται την ίδια πρόθεση και πρόγραμμα.') },
          { step: '3', title: t('home.how.step3.title', 'Επιβεβαιώστε & συναντηθείτε'), body: t('home.how.step3.body', 'Ξεκλειδώστε το group chat, ορίστε σημείο συνάντησης και απολαύστε την εμπειρία.') },
        ].map(({ step, title, body }) => (
          <div key={step} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-7 h-7 bg-cyan-50 text-[#0E8B8D] rounded-full flex items-center justify-center font-bold text-[12.5px] mb-2">{step}</div>
            <h3 className="font-bold text-[#111827] text-[15px] mb-1">{title}</h3>
            <p className="text-[12.5px] leading-relaxed text-gray-500 font-medium">{body}</p>
          </div>
        ))}
      </section>

      {/* Categories & Filters */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[11.2px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            {t(`Εξερεύνηση Κατηγοριών`, `Explore Categories`)}
          </h2>
          <div
            ref={catScrollRef}
            onMouseDown={handleCatMouseDown}
            onMouseMove={handleCatMouseMove}
            onMouseUp={handleCatMouseUp}
            onMouseLeave={handleCatMouseUp}
            className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar cursor-grab active:cursor-grabbing select-none"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { if (!catDragged.current) setActiveCategory(cat); }}
                className={cn(
                  'whitespace-nowrap px-3 py-1 rounded-full text-[11.875px] font-bold shadow-sm transition-colors uppercase tracking-wider',
                  activeCategory === cat
                    ? 'bg-[#111827] text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-[#111827] hover:bg-gray-50'
                )}
              >
                {categoryTranslations[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={cn(
                'whitespace-nowrap px-2.5 py-1 rounded-full text-[10.64px] font-bold transition-colors border',
                tagFilter === tag
                  ? 'bg-[#18D8DB]/20 border-[#18D8DB] text-[#0E8B8D]'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#111827]'
              )}
            >
              {tagTranslations[tag] ?? tag}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar items-center flex-wrap">
          <select
            className="text-[12.5px] border border-gray-200 rounded-full shadow-sm bg-white hover:bg-gray-50 py-1.5 px-2.5 font-medium outline-none cursor-pointer"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as typeof priceFilter)}
          >
            <option value="All">{t(`Όλοι οι Τύποι`, `All Types`)}</option>
            <option value="Free">{t(`Δωρεάν`, `Free`)}</option>
            <option value="Paid">{t(`Επί Πληρωμή`, `Paid`)}</option>
            <option value="Group Discount">{t(`Ομαδική Έκπτωση`, `Group Discount`)}</option>
          </select>

          <select
            className="text-[12.5px] border border-gray-200 rounded-full shadow-sm bg-white hover:bg-gray-50 py-1.5 px-2.5 font-medium outline-none cursor-pointer"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          >
            <option value="Any">{t(`Οποιαδήποτε Ημ/νία`, `Any Date`)}</option>
            <option value="Today">{t(`Σήμερα`, `Today`)}</option>
            <option value="This Week">{t(`Αυτή την Εβδομάδα`, `This Week`)}</option>
            <option value="This Month">{t(`Αυτόν τον Μήνα`, `This Month`)}</option>
          </select>

          <select
            className="text-[12.5px] border border-gray-200 rounded-full shadow-sm bg-white hover:bg-gray-50 py-1.5 px-2.5 font-medium outline-none cursor-pointer"
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value as typeof safetyFilter)}
          >
            <option value="All">{t(`Όλα τα Επίπεδα`, `All Levels`)}</option>
            <option value="low">{t(`Δημόσιοι Χώροι`, `Public Venues`)}</option>
            <option value="medium">{t(`Οργανωμένοι Hosts`, `Organized Hosts`)}</option>
            <option value="high_trust">{t(`Επαληθευμένες Ομάδες`, `Verified Groups`)}</option>
          </select>

          <select
            className="text-[12.5px] border border-gray-200 rounded-full shadow-sm bg-white hover:bg-gray-50 py-1.5 px-2.5 font-medium outline-none cursor-pointer"
            value={radiusFilter}
            onChange={(e) => setRadiusFilter(e.target.value as typeof radiusFilter)}
          >
            <option value="Any">{t(`Οποιαδήποτε Απόσταση`, `Any Distance`)}</option>
            <option value="5km">{t(`Εντός 5χλμ`, `Within 5km`)}</option>
            <option value="10km">{t(`Εντός 10χλμ`, `Within 10km`)}</option>
            <option value="25km">{t(`Εντός 25χλμ`, `Within 25km`)}</option>
          </select>

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              className="text-[12.5px] border border-gray-200 rounded-full shadow-sm bg-white hover:bg-gray-50 py-1.5 pl-6 pr-2.5 font-medium outline-none cursor-pointer appearance-none"
              value={sortParam}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                p.set('sort', e.target.value);
                setSearchParams(p);
              }}
            >
              <option value="Relevance">{t(`Συνάφεια`, `Relevance`)}</option>
              <option value="Distance">{t(`Απόσταση`, `Distance`)}</option>
              <option value="Group Progress">{t(`Πρόοδος Ομάδας`, `Group Progress`)}</option>
            </select>
            <ArrowDownUp className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg w-fit">
            <button
              onClick={() => setFeedType('For You')}
              className={cn('px-3.5 py-1.5 rounded-md text-[12.5px] font-bold transition-colors', feedType === 'For You' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500 hover:text-[#111827]')}
            >
              {t(`Για Σένα`, `For You`)}
            </button>
            <button
              onClick={() => setFeedType('Discover')}
              className={cn('px-3.5 py-1.5 rounded-md text-[12.5px] font-bold transition-colors', feedType === 'Discover' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500 hover:text-[#111827]')}
            >
              {t(`Ανακάλυψε`, `Discover`)}
            </button>
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-lg w-fit">
            <button className="p-1.5 rounded-md transition-colors bg-white shadow-sm text-[#111827]">
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/nearby')}
              className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-[#111827]"
              title={t(`Άνοιγμα Χάρτη`, `Open Map`)}
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : sortedEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-[15px]">{t(`Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.`, `No events found matching your criteria.`)}</p>
            </div>
          ) : (
            visibleEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>

        {/* Load More */}
        {!isLoading && visibleEventsCount < sortedEvents.length && (
          <div className="flex justify-center mt-5">
            <button
              onClick={() => setVisibleEventsCount(c => c + 6)}
              className="flex items-center gap-1.5 px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-[12.5px] font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {t(`Φόρτωση Περισσοτέρων`, `Load More`)} ({sortedEvents.length - visibleEventsCount})
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
