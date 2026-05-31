import { useEffect, useRef } from 'react';
import { ArrowDownUp, Crown, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { HOME_CATEGORIES, HOME_POPULAR_TAGS } from '../../lib/homeFeedConstants';
import { getHomeCategoryTranslations, getHomeTagTranslations } from '../../lib/homeCategoryLabels';
import { HomePersonalizationHint } from './HomePersonalizationHint';
import { HomeDiscoveryPrefsChips } from './HomeDiscoveryPrefsChips';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
  HomeSortParam,
} from '../../lib/homeFeedConstants';

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
        <h2 className={`text-[11.6px] font-bold tracking-wide ${h.sectionLabel}`}>
          {t('home.explore_categories', 'Εξερευνηση κατηγοριων')}
        </h2>
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-full text-[12px] font-bold shadow-soft ${h.filterBtn}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('Φίλτρα', 'Filters')}
          {activeFilterCount > 0 && (
            <span className={`text-[10px] px-1.5 rounded-full ${h.filterBadge}`}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <HomePersonalizationHint useClassicTokens />
      <HomeDiscoveryPrefsChips useClassicTokens />

      <div
        ref={categoryScrollRef}
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1 noscrollbar"
      >
        {HOME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[12.75px] font-bold shadow-soft transition-all duration-200 tracking-wide ${
              activeCategory === cat ? h.chipActive : h.chipInactive
            }`}
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
            className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[11.82px] font-bold transition-all duration-200 border ${
              tagFilter === tag ? h.tagActive : h.tagInactive
            }`}
          >
            {tagTranslations[tag] ?? tag}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar items-center flex-wrap">
        <select
          className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
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
          className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as HomeDateFilter)}
        >
          <option value="Any">{t('home.filter.any_date', 'Οποιαδήποτε Ημ/νία')}</option>
          <option value="Today">{t('home.filter.today', 'Σήμερα')}</option>
          <option value="This Week">{t('home.filter.this_week', 'Αυτή την Εβδομάδα')}</option>
          <option value="This Month">{t('home.filter.this_month', 'Αυτόν τον Μήνα')}</option>
        </select>

        <select
          className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
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
          className={`text-[12.73px] outline-none cursor-pointer transition-all duration-200 ${h.select}`}
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
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1 rounded-full text-[11.82px] font-bold transition-all duration-200 border ${seekingHostOnly ? h.tagActive : h.tagInactive}`}
          >
            <Crown className="w-3.5 h-3.5" />
            {t('Χωρίς διοργανωτή', 'Seeking organizer')}
          </button>
        )}

        <div className="relative ml-auto">
          <select
            className={`text-[12.73px] pl-7 pr-3 font-medium outline-none cursor-pointer appearance-none transition-all duration-200 ${h.select}`}
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
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60 ${h.labelMuted}`}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11.82px] font-bold text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            {t('Καθαρισμός', 'Clear')}
          </button>
        )}
      </div>
    </section>
  );
}
