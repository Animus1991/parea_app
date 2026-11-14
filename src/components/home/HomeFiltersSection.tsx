import { useEffect, useRef } from 'react';
import { ArrowDownUp, Crown, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { HOME_CATEGORIES, HOME_POPULAR_TAGS } from '../../lib/homeFeedConstants';
import { getHomeCategoryTranslations, getHomeTagTranslations } from '../../lib/homeCategoryLabels';
import { HomePersonalizationHint } from './HomePersonalizationHint';
import { HomeDiscoveryPrefsChips } from './HomeDiscoveryPrefsChips';
import { MoodSelector } from './MoodSelector';
import { HOME_TYPO } from '../../lib/typographyTokens';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
  HomeSortParam,
} from '../../lib/homeFeedConstants';
import { cn } from '../../lib/utils';

export interface HomeFiltersSectionProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  priceFilter: HomePriceFilter;
  setPriceFilter: (v: HomePriceFilter) => void;
  dateFilter: HomeDateFilter;
  setDateFilter: (v: HomeDateFilter) => void;
  safetyFilter: HomeSafetyFilter;
  setSafetyFilter: (v: HomeSafetyFilter) => void;
  radiusFilter: HomeRadiusFilter;
  setRadiusFilter: (v: HomeRadiusFilter) => void;
  sortParam: HomeSortParam;
  setSortParam: (v: HomeSortParam) => void;
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
  showSeekingHostChip: boolean;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onOpenMobileFilters: () => void;
  activeFilterCount: number;
  activeMood?: string | null;
  onSelectMood?: (moodId: string | null, categories: string[]) => void;
}

export function HomeFiltersSection({
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
  seekingHostOnly,
  onToggleSeekingHostOnly,
  showSeekingHostChip,
  hasActiveFilters,
  onClearAll,
  onOpenMobileFilters,
  activeFilterCount,
  activeMood = null,
  onSelectMood,
}: HomeFiltersSectionProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const categoryTranslations = getHomeCategoryTranslations(t);
  const tagTranslations = getHomeTagTranslations(t);

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

  return (
    <section id="home-filters" className="space-y-4 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className={`text-xs font-bold tracking-wide ${h.sectionLabel}`}>
          {t('home.explore_categories', 'Εξερευνηση κατηγοριων')}
        </h2>
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-full text-xs font-bold shadow-soft ${h.filterBtn}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('Φίλτρα', 'Filters')}
          {activeFilterCount > 0 && (
            <span className={`text-xs px-1.5 rounded-full ${h.filterBadge}`}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <HomePersonalizationHint useClassicTokens />
      <HomeDiscoveryPrefsChips useClassicTokens />

      {onSelectMood && (
        <MoodSelector activeMood={activeMood} onSelectMood={onSelectMood} />
      )}

      <div
        ref={categoryScrollRef}
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1 noscrollbar"
      >
        {HOME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              HOME_TYPO.filterChip,
              'whitespace-nowrap px-4 rounded-full shadow-soft transition-all duration-200 tracking-wide',
              activeCategory === cat ? h.chipActive : h.chipInactive,
            )}
          >
            {categoryTranslations[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar">
        {HOME_POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setTagFilter(tag)}
            className={cn(
              HOME_TYPO.filterChip,
              'whitespace-nowrap px-3.5 rounded-full transition-all duration-200 border',
              tagFilter === tag ? h.tagActive : h.tagInactive,
            )}
          >
            {tagTranslations[tag] ?? tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className={cn(
            'outline-none cursor-pointer transition-all duration-200',
            HOME_TYPO.filterControlEqual,
            h.select,
          )}
          aria-label={t('Φίλτρο τιμής', 'Price filter')}
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as HomePriceFilter)}
        >
          <option value="All">{t('home.filter.all_types', 'Όλοι οι Τύποι')}</option>
          <option value="Free">{t('home.filter.free', 'Δωρεάν')}</option>
          <option value="Paid">{t('home.filter.paid', 'Επί Πληρωμή')}</option>
          <option value="Group Discount">
            {t('home.filter.group_discount', 'Ομαδική Έκπτωση')}
          </option>
        </select>

        <select
          className={cn(
            'outline-none cursor-pointer transition-all duration-200',
            HOME_TYPO.filterControlEqual,
            h.select,
          )}
          aria-label={t('Φίλτρο ημερομηνίας', 'Date filter')}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as HomeDateFilter)}
        >
          <option value="Any">{t('home.filter.any_date', 'Οποιαδήποτε Ημ/νία')}</option>
          <option value="Today">{t('home.filter.today', 'Σήμερα')}</option>
          <option value="This Week">{t('home.filter.this_week', 'Αυτή την Εβδομάδα')}</option>
          <option value="This Month">{t('home.filter.this_month', 'Αυτόν τον Μήνα')}</option>
        </select>

        <select
          className={cn(
            'outline-none cursor-pointer transition-all duration-200',
            HOME_TYPO.filterControlEqual,
            h.select,
          )}
          aria-label={t('Φίλτρο άνεσης & ασφάλειας', 'Comfort & safety filter')}
          value={safetyFilter}
          onChange={(e) => setSafetyFilter(e.target.value as HomeSafetyFilter)}
        >
          <option value="All">{t('home.filter.all_comfort', 'Όλα τα Επίπεδα')}</option>
          <option value="low">{t('home.filter.public', 'Δημόσιοι Χώροι')}</option>
          <option value="medium">{t('home.filter.organized', 'Οργανωμένοι Hosts')}</option>
          <option value="high_trust">
            {t('home.filter.verified', 'Επαληθευμένες Ομάδες')}
          </option>
        </select>

        <select
          className={cn(
            'outline-none cursor-pointer transition-all duration-200',
            HOME_TYPO.filterControlEqual,
            h.select,
          )}
          aria-label={t('Φίλτρο απόστασης', 'Distance filter')}
          value={radiusFilter}
          onChange={(e) => setRadiusFilter(e.target.value as HomeRadiusFilter)}
        >
          <option value="Any">{t('home.filter.any_distance', 'Οποιαδήποτε Απόσταση')}</option>
          <option value="5km">{t('home.filter.5km', 'Εντός 5χλμ')}</option>
          <option value="10km">{t('home.filter.10km', 'Εντός 10χλμ')}</option>
          <option value="25km">{t('home.filter.25km', 'Εντός 25χλμ')}</option>
        </select>

        {showSeekingHostChip && (
          <button
            type="button"
            onClick={onToggleSeekingHostOnly}
            className={cn(
              HOME_TYPO.filterChip,
              HOME_TYPO.filterControlEqual,
              'gap-1.5 px-3.5 rounded-full transition-all duration-200 border',
              seekingHostOnly ? h.tagActive : h.tagInactive,
            )}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('Χωρίς διοργανωτή', 'Seeking organizer')}</span>
          </button>
        )}

        <div className={cn('relative', HOME_TYPO.filterControlEqual)}>
          <select
            className={cn(
              'w-full pl-6 pr-2 outline-none cursor-pointer appearance-none transition-all duration-200',
              h.select,
            )}
            aria-label={t('Ταξινόμηση', 'Sort by')}
            value={sortParam}
            onChange={(e) => setSortParam(e.target.value as HomeSortParam)}
          >
            <option value="Relevance">{t('home.feed.sort.relevance', 'Συνάφεια')}</option>
            <option value="Distance">{t('home.feed.sort.distance', 'Απόσταση')}</option>
            <option value="Group Progress">
              {t('home.feed.sort.group_progress', 'Πρόοδος Ομάδας')}
            </option>
          </select>
          <ArrowDownUp
            className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none opacity-60 ${h.labelMuted}`}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="col-span-2 flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            {t('Καθαρισμός', 'Clear')}
          </button>
        )}
      </div>
    </section>
  );
}
