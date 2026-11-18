import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import type { HomeDateFilter, HomePriceFilter, HomeRadiusFilter } from '../../lib/homeFeedConstants';

export interface HomeQuickDecisionRowProps {
  dateFilter: HomeDateFilter;
  setDateFilter: (v: HomeDateFilter) => void;
  radiusFilter: HomeRadiusFilter;
  setRadiusFilter: (v: HomeRadiusFilter) => void;
  priceFilter: HomePriceFilter;
  setPriceFilter: (v: HomePriceFilter) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function HomeQuickDecisionRow({
  dateFilter,
  setDateFilter,
  radiusFilter,
  setRadiusFilter,
  priceFilter,
  setPriceFilter,
  onOpenFilters,
  activeFilterCount,
}: HomeQuickDecisionRowProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();

  const chip = (on: boolean) =>
    cn(
      HOME_TYPO.filterChip,
      'whitespace-nowrap px-3.5 rounded-full transition-colors duration-150 min-h-8',
      on ? h.chipActive : h.chipInactive,
    );

  return (
    <div className="flex items-center gap-2 overflow-x-auto noscrollbar pb-0.5">
      <button
        type="button"
        onClick={() => setDateFilter(dateFilter === 'Today' ? 'Any' : 'Today')}
        className={chip(dateFilter === 'Today')}
      >
        {t('Σήμερα', 'Today')}
      </button>
      <button
        type="button"
        onClick={() => setRadiusFilter(radiusFilter === '10km' ? 'Any' : '10km')}
        className={chip(radiusFilter === '10km')}
      >
        {t('Κοντά μου', 'Near me')}
      </button>
      <button
        type="button"
        onClick={() => setPriceFilter(priceFilter === 'Free' ? 'All' : 'Free')}
        className={chip(priceFilter === 'Free')}
      >
        {t('Δωρεάν', 'Free')}
      </button>
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'ml-auto flex shrink-0 items-center gap-1.5 px-3 min-h-8 rounded-full text-xs font-bold shadow-soft',
          h.filterBtn,
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
        {t('Φίλτρα', 'Filters')}
        {activeFilterCount > 0 && (
          <span className={`text-xs px-1.5 rounded-full ${h.filterBadge}`}>{activeFilterCount}</span>
        )}
      </button>
    </div>
  );
}
