import { useEffect, useRef } from 'react';
import { Crown, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { HOME_CATEGORIES, HOME_POPULAR_TAGS } from '../../lib/homeFeedConstants';
import { getHomeCategoryTranslations, getHomeTagTranslations } from '../../lib/homeCategoryLabels';
import { HomePersonalizationHint } from './HomePersonalizationHint';
import { HomeDiscoveryPrefsChips } from './HomeDiscoveryPrefsChips';
import { HomeFilterSelect } from './HomeFilterSelect';
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
        <HomeFilterSelect
          ariaLabel={t('Φίλτρο τιμής', 'Price filter')}
          value={priceFilter}
          onValueChange={setPriceFilter}
          options={[
            { value: 'All', label: t('home.filter.all_types', 'Όλοι οι Τύποι') },
            { value: 'Free', label: t('home.filter.free', 'Δωρεάν') },
            { value: 'Paid', label: t('home.filter.paid', 'Επί Πληρωμή') },
            { value: 'Group Discount', label: t('home.filter.group_discount', 'Ομαδική Έκπτωση') },
          ]}
        />

        <HomeFilterSelect
          ariaLabel={t('Φίλτρο ημερομηνίας', 'Date filter')}
          value={dateFilter}
          onValueChange={setDateFilter}
          options={[
            { value: 'Any', label: t('home.filter.any_date', 'Οποιαδήποτε Ημ/νία') },
            { value: 'Today', label: t('home.filter.today', 'Σήμερα') },
            { value: 'This Week', label: t('home.filter.this_week', 'Αυτή την Εβδομάδα') },
            { value: 'This Month', label: t('home.filter.this_month', 'Αυτόν τον Μήνα') },
          ]}
        />

        <HomeFilterSelect
          ariaLabel={t('Φίλτρο άνεσης & ασφάλειας', 'Comfort & safety filter')}
          value={safetyFilter}
          onValueChange={setSafetyFilter}
          options={[
            { value: 'All', label: t('home.filter.all_comfort', 'Όλα τα Επίπεδα') },
            { value: 'low', label: t('home.filter.public', 'Δημόσιοι Χώροι') },
            { value: 'medium', label: t('home.filter.organized', 'Οργανωμένοι Hosts') },
            { value: 'high_trust', label: t('home.filter.verified', 'Επαληθευμένες Ομάδες') },
          ]}
        />

        <HomeFilterSelect
          ariaLabel={t('Φίλτρο απόστασης', 'Distance filter')}
          value={radiusFilter}
          onValueChange={setRadiusFilter}
          options={[
            { value: 'Any', label: t('home.filter.any_distance', 'Οποιαδήποτε Απόσταση') },
            { value: '5km', label: t('home.filter.5km', 'Εντός 5χλμ') },
            { value: '10km', label: t('home.filter.10km', 'Εντός 10χλμ') },
            { value: '25km', label: t('home.filter.25km', 'Εντός 25χλμ') },
          ]}
        />

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

        <HomeFilterSelect
          ariaLabel={t('Ταξινόμηση', 'Sort by')}
          value={sortParam}
          onValueChange={setSortParam}
          showLeadingChevron
          options={[
            { value: 'Relevance', label: t('home.feed.sort.relevance', 'Συνάφεια') },
            { value: 'Distance', label: t('home.feed.sort.distance', 'Απόσταση') },
            { value: 'Group Progress', label: t('home.feed.sort.group_progress', 'Πρόοδος Ομάδας') },
          ]}
        />

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
