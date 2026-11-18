import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Grid,
  TrendingUp,
  Star,
  Compass,
  Calendar,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EventCard } from '../events/EventCard';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import {
  CATEGORY_CATALOG,
  CATEGORY_GROUP_TABS,
  getCategoryGroupTabLabel,
  type CategoryGroupTab,
} from '../../lib/categoriesCatalog';
import { CollectionsRail } from '../outings/CollectionsRail';
import { APP_TYPO } from '../../lib/typographyTokens';
import { isEventPast } from '../../lib/eventDisplay';

type PriceFilter = 'All' | 'Free' | 'Paid' | 'Group Discount';
type DateFilter = 'Any' | 'Today' | 'This Week' | 'This Month' | 'Weekend';
type SortBy = 'Relevance' | 'Trending' | 'Distance' | 'Group Progress';

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
  "filter-select border shadow-soft focus:outline-none shrink-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.4rem_center] pr-6 transition-colors";

/** Unified categories (ZIP parity + Classic design tokens via usePageContrast). */
export default function CategoriesPageContent() {
  const navigate = useNavigate();
  const { t, tu, language } = useLanguage();
  const p = usePageContrast();
  const { events, isLoading, isError, refetch } = useEventsResource();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('c') || null;
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCat);
  const [activeTab, setActiveTab] = useState<CategoryGroupTab>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Any');
  const [sortBy, setSortBy] = useState<SortBy>('Trending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const current = searchParams.get('c');
    if ((current || null) === (activeCategory || null)) return;
    const next = new URLSearchParams(searchParams);
    if (activeCategory) next.set('c', activeCategory);
    else next.delete('c');
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [activeCategory, searchParams, setSearchParams]);

  const categoryCounts = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, event) => {
      const cat = event.category || '';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const sortedCategories = useMemo(() => {
    let cats = CATEGORY_CATALOG.map((cat) => ({
      ...cat,
      count: categoryCounts[cat.name] || 0,
      displayName: language === 'el' ? cat.labelGr : cat.labelEn,
    }));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.filter(
        (cat) =>
          cat.displayName.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q),
      );
    }

    if (activeTab !== 'All') {
      cats = cats.filter((c) => c.group === activeTab);
    }

    return cats.sort((a, b) => b.count - a.count);
  }, [categoryCounts, activeTab, searchQuery, language]);

  const trendingCategories = useMemo(
    () =>
      CATEGORY_CATALOG.map((cat) => ({
        ...cat,
        count: categoryCounts[cat.name] || 0,
        displayName: language === 'el' ? cat.labelGr : cat.labelEn,
      }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [categoryCounts, language],
  );

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((e) => {
        if (
          activeCategory &&
          e.category !== activeCategory &&
          !activeCategory.includes(e.category)
        ) {
          return false;
        }
        if (priceFilter === 'Free' && e.isPaid) return false;
        if (priceFilter === 'Paid' && !e.isPaid) return false;
        if (priceFilter === 'Group Discount' && !e.groupDiscount) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inTitle = e.title.toLowerCase().includes(q);
          const inDesc = e.description?.toLowerCase().includes(q) ?? false;
          const inTags = (e.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
          const inCat = (e.category || '').toLowerCase().includes(q);
          if (!inTitle && !inDesc && !inTags && !inCat) return false;
        }
        if (dateFilter !== 'Any') {
          const eDate = parseISO(e.date);
          const day = eDate.getDay();
          if (dateFilter === 'Today' && !isToday(eDate)) return false;
          if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
          if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
          if (dateFilter === 'Weekend' && day !== 0 && day !== 6) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pastA = isEventPast(a) ? 1 : 0;
        const pastB = isEventPast(b) ? 1 : 0;
        if (pastA !== pastB) return pastA - pastB;
        if (sortBy === 'Trending') {
          return (b.currentParticipants || 0) - (a.currentParticipants || 0);
        }
        if (sortBy === 'Group Progress') {
          const progA = (a.currentParticipants || 0) / (a.maxParticipants || 1);
          const progB = (b.currentParticipants || 0) / (b.maxParticipants || 1);
          return progB - progA;
        }
        if (sortBy === 'Distance') {
          return (a.lat ? 1 : 0) - (b.lat ? 1 : 0);
        }
        return 0;
      });
  }, [events, activeCategory, priceFilter, dateFilter, sortBy, searchQuery]);

  const selectTone = p.isDark
    ? 'bg-gray-800/80 border-gray-700 text-gray-200'
    : 'bg-white border-gray-200 text-gray-800 cursor-pointer';

  const chooseCategory = (name: string) => {
    const next = activeCategory === name ? null : name;
    setActiveCategory(next);
  };

  useEffect(() => {
    if (!activeCategory) return;
    const id = window.setTimeout(scrollToEvents, 80);
    return () => window.clearTimeout(id);
  }, [activeCategory]);

  return (
    <div className="max-w-full mx-auto space-y-4 md:space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div
        className={cn(
          'p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative shadow-soft',
          'bg-gradient-to-br from-hero-from to-hero-to text-hero-fg',
        )}
      >
        <div className="relative z-10 w-full md:max-w-2xl text-center md:text-left">
          <Badge
            variant="outline"
            className="mb-2 border-hero-fg/20 bg-hero-fg/10 text-hero-fg backdrop-blur-md"
          >
            <Compass className="w-3.5 h-3.5 mr-1" />{' '}
            {t('Εξερεύνηση δραστηριοτήτων', 'Activity explorer')}
          </Badge>
          <h1 className={cn(APP_TYPO.pageTitle, 'mb-1.5')}>
            {t('Βρείτε την επόμενη', 'Find your next')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hero-accent-from to-hero-accent-to">
              {t('εμπειρία σας', 'experience')}
            </span>
          </h1>
          <p className="text-sm font-medium text-hero-fg/80 leading-snug mb-3">
            {t(
              'Ανακαλύψτε επιλεγμένες εκδηλώσεις που ταιριάζουν στα ενδιαφέροντά σας.',
              'Discover handpicked events matching your interests.',
            )}
          </p>
          <div className="relative w-full max-w-md mx-auto md:mx-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hero-fg/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) scrollToEvents();
              }}
              placeholder={t(
                'Αναζήτηση κατηγορίας ή εκδήλωσης...',
                'Search a category or event...',
              )}
              aria-label={t('Αναζήτηση κατηγορίας ή εκδήλωσης', 'Search a category or event')}
              className="search-control w-full h-9 pl-9 pr-3 rounded-xl border-0 bg-hero-fg/10 text-hero-fg placeholder:text-hero-fg/60 focus:outline-none focus:ring-2 focus:ring-hero-fg/40 backdrop-blur-md transition-all"
            />
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-hero-fg/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </div>

      {/* Φ27 — themed collections */}
      {!searchQuery.trim() && <CollectionsRail />}

      {!searchQuery && !activeCategory && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={cn('w-4 h-4', p.iconAccent)} />
            <span className={cn('text-xs font-bold tracking-wider', p.sub)}>
              {tu('Δημοφιλή Τώρα', 'Trending Now')}
            </span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 noscrollbar">
            {trendingCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => chooseCategory(cat.name)}
                className={cn(
                  'flex min-w-[11.5rem] shrink-0 items-center gap-2.5 rounded-2xl border p-2.5 text-left text-xs shadow-soft',
                  p.cardSurface,
                  p.borderB,
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    cat.bg,
                    cat.border,
                  )}
                >
                  <cat.icon className={cn('h-4 w-4', cat.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={cn('truncate text-xs font-bold', p.head)}>{cat.displayName}</h3>
                  <p className={cn('text-2xs font-medium', p.muted)}>
                    {cat.count} {t('ενεργές', 'active')}
                  </p>
                </div>
                <ArrowRight className={cn('h-3.5 w-3.5 shrink-0', p.iconAccent)} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      {!searchQuery.trim() && (
      <div
        className={cn(
          'rounded-2xl border shadow-soft p-1',
          p.isDark ? 'bg-[hsl(220_16%_14%)] border-gray-700/50' : 'bg-white border-gray-100',
        )}
      >
        <div
          role="tablist"
          aria-label={t('Ομάδες κατηγοριών', 'Category groups')}
          className="flex overflow-x-auto noscrollbar"
        >
          {CATEGORY_GROUP_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                setActiveCategory(null);
              }}
              className={cn(
                'shrink-0 px-2 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all text-center',
                activeTab === tab
                  ? p.isDark
                    ? 'bg-[hsl(220_16%_18%)] text-white shadow-soft'
                    : 'bg-gray-100 text-ink shadow-soft'
                  : cn(
                      'hover:bg-gray-50',
                      p.isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:text-gray-900',
                    ),
              )}
            >
              {getCategoryGroupTabLabel(tab, t)}
            </button>
          ))}
        </div>
      </div>
      )}

      {sortedCategories.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => chooseCategory(cat.name)}
            className={cn(
              'rounded-2xl p-3 sm:p-4 border shadow-soft flex flex-col items-center text-center text-xs',
              p.cardSurface,
              activeCategory === cat.name
                ? cn(
                    'ring-2 ring-offset-1 ring-accent border-transparent',
                    p.isDark ? 'ring-offset-gray-900' : 'ring-offset-white',
                  )
                : cn(p.borderB, p.isDark ? 'hover:border-gray-500' : 'hover:border-gray-300'),
            )}
          >
            <div
              className={cn(
                'w-11 h-11 rounded-2xl border-2 flex items-center justify-center mb-2.5 shadow-soft',
                cat.bg,
                cat.border,
              )}
            >
              <cat.icon className={cn('w-5 h-5 sm:w-6 sm:h-6', cat.color)} />
            </div>
            <h3
              className={cn(
                'font-bold text-sm sm:text-sm leading-tight line-clamp-1 w-full',
                p.head,
                p.hoverText,
              )}
            >
              {cat.displayName}
            </h3>
            <p className={cn('card-meta font-medium mt-1.5', p.muted)}>
              {cat.count}{' '}
              {cat.count === 1 ? t('Εκδήλωση', 'Event') : t('Εκδηλώσεις', 'Events')}
            </p>
          </button>
        ))}
      </div>
      )}

      {sortedCategories.length === 0 && filteredEvents.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('Δεν βρέθηκαν αποτελέσματα', 'No categories match your search')}
          actionLabel={t('Καθαρισμός', 'Clear search')}
          onAction={() => setSearchQuery('')}
          secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
          onSecondary={() => navigate('/buddy-seek')}
        />
      )}

      <div className={cn('mt-6 border-t pt-5 scroll-mt-24', p.borderT)} id="events-area">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center border shadow-soft',
                p.cardSurface,
                p.borderB,
              )}
            >
              {activeCategory ? (
                (() => {
                  const Ac = CATEGORY_CATALOG.find((c) => c.name === activeCategory);
                  if (Ac) return <Ac.icon className={cn('w-5 h-5', Ac.color)} />;
                  return <Grid className={cn('w-5 h-5', p.iconAccent)} />;
                })()
              ) : (
                <Calendar className={cn('w-5 h-5', p.iconAccent)} />
              )}
            </div>
            <div>
              <h2 className={cn('text-sm md:text-base font-bold tracking-tight', p.head)}>
                {activeCategory
                  ? language === 'el'
                    ? CATEGORY_CATALOG.find((c) => c.name === activeCategory)?.labelGr
                    : CATEGORY_CATALOG.find((c) => c.name === activeCategory)?.labelEn
                  : t('Όλες οι Εκδηλώσεις', 'All Discoveries')}
              </h2>
              <p className={cn('text-xs font-bold tracking-wider mt-0.5', p.muted)}>
                {filteredEvents.length} {tu('αποτελέσματα', 'results found')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center overflow-x-auto noscrollbar pb-0.5">
            <select aria-label={t("Φίλτρο κόστους", "Cost filter")}
              className={cn(SELECT_CLASS, selectTone)}
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            >
              <option value="All">{t('Κόστος: Οποιοδήποτε', 'Cost: Any')}</option>
              <option value="Free">{t('Μόνο δωρεάν', 'Free only')}</option>
              <option value="Paid">{t('Μόνο επί πληρωμή', 'Paid only')}</option>
              <option value="Group Discount">
                {t('Με Ομαδική Έκπτωση', 'Has Group Discount')}
              </option>
            </select>

            <select aria-label={t("Φίλτρο χρόνου", "Time filter")}
              className={cn(SELECT_CLASS, selectTone)}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="Any">{t('Χρόνος: Οποτεδήποτε', 'Time: Anytime')}</option>
              <option value="Today">{t('Σήμερα', 'Today')}</option>
              <option value="This Week">{t('Αυτή την Εβδομάδα', 'This Week')}</option>
              <option value="This Month">{t('Αυτόν τον μήνα', 'This Month')}</option>
              <option value="Weekend">{t('Το Σαββατοκύριακο', 'This Weekend')}</option>
            </select>

            <select aria-label={t("Ταξινόμηση", "Sort by")}
              className={cn(SELECT_CLASS, selectTone)}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="Trending">{t('Ταξινόμηση: Κορυφαία', 'Sort: Trending')}</option>
              <option value="Distance">{t('Ταξινόμηση: Πιο κοντά', 'Sort: Distance')}</option>
              <option value="Group Progress">
                {t('Ταξινόμηση: Πρόοδος', 'Sort: Fill rate')}
              </option>
            </select>
          </div>
        </div>

        <ResourceStateGate
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          loading={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <EventCardSkeleton key={`cat-sk-${i}`} />
              ))}
            </div>
          }
          errorTitle={t('Αδυναμία φόρτωσης εκδηλώσεων', 'Could not load events')}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={Bookmark}
                  title={t('Δεν βρέθηκαν εκδηλώσεις', 'No events found')}
                  description={t('Δοκιμάστε να αλλάξετε φίλτρα ή κατηγορία.', 'Try changing filters or category.')}
                  actionLabel={t('Καθαρισμός Φίλτρων', 'Reset Filters')}
                  onAction={() => {
                    setActiveCategory(null);
                    setPriceFilter('All');
                    setDateFilter('Any');
                    setSearchQuery('');
                  }}
                />
              </div>
            ) : (
              filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </ResourceStateGate>
      </div>

      <div
        className={cn(
          'mt-12 rounded-2xl p-4 md:p-5 border shadow-soft flex flex-col justify-center items-center text-center gap-5 relative overflow-hidden',
          p.isDark ? 'bg-[hsl(220_16%_16%)] border-gray-700' : 'bg-cyan-50/50 border-cyan-100',
        )}
      >
        <Badge
          variant="outline"
          className={cn(
            'mb-2',
            p.isDark ? 'border-cyan-500/30 text-cyan-400 bg-cyan-900/10' : 'border-cyan-200 text-cyan-700 bg-white',
          )}
        >
          <Star className="w-3.5 h-3.5 mr-1" /> {t('Γίνε Οικοδεσπότης', 'Become a Host')}
        </Badge>
        <h3 className={cn('text-sm md:text-base font-bold tracking-tight', p.head)}>
          {t('Μην βρήκατε αυτό που ψάχνατε;', "Couldn't find what you wanted?")}
        </h3>
        <p className={cn('text-sm max-w-lg mx-auto font-medium leading-relaxed', p.sub)}>
          {t(
            'Δημιουργήστε τη δική σας εκδήλωση και συγκεντρώστε ανθρώπους με παρόμοια ενδιαφέροντα.',
            'Create your own event and gather people with similar passions.',
          )}
        </p>
        <Button onClick={() => navigate('/create')} size="md">
          {t('Δημιουργία Νέας Εμπειρίας', 'Create New Experience')}
        </Button>
      </div>
    </div>
  );
}
