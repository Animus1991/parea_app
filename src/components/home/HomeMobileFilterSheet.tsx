import { FilterBottomSheet } from '../common/FilterBottomSheet';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
} from '../../lib/homeFeedConstants';

export interface HomeMobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  onClear: () => void;
  priceFilter: HomePriceFilter;
  setPriceFilter: (v: HomePriceFilter) => void;
  dateFilter: HomeDateFilter;
  setDateFilter: (v: HomeDateFilter) => void;
  radiusFilter: HomeRadiusFilter;
  setRadiusFilter: (v: HomeRadiusFilter) => void;
}

export function HomeMobileFilterSheet({
  open,
  onClose,
  activeCount,
  onClear,
  priceFilter,
  setPriceFilter,
  dateFilter,
  setDateFilter,
  radiusFilter,
  setRadiusFilter,
}: HomeMobileFilterSheetProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();

  return (
    <FilterBottomSheet
      open={open}
      onClose={onClose}
      activeCount={activeCount}
      onClear={onClear}
    >
      <div className="space-y-4">
        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Τιμή', 'Price')}</p>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Free', 'Paid', 'Group Discount'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriceFilter(p)}
                className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${priceFilter === p ? h.chipActive : h.chipInactive}`}
              >
                {p === 'All'
                  ? t('Όλα', 'All')
                  : p === 'Free'
                    ? t('Δωρεάν', 'Free')
                    : p === 'Paid'
                      ? t('Επί πληρωμή', 'Paid')
                      : t('Ομαδική έκπτωση', 'Group discount')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Ημερομηνία', 'Date')}</p>
          <div className="flex flex-wrap gap-2">
            {(['Any', 'Today', 'This Week', 'This Month'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDateFilter(d)}
                className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${dateFilter === d ? h.chipActive : h.chipInactive}`}
              >
                {d === 'Any'
                  ? t('Οποτεδήποτε', 'Any')
                  : d === 'Today'
                    ? t('Σήμερα', 'Today')
                    : d === 'This Week'
                      ? t('Αυτή την εβδομάδα', 'This week')
                      : t('Αυτόν τον μήνα', 'This month')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Απόσταση', 'Distance')}</p>
          <div className="flex flex-wrap gap-2">
            {(['Any', '5km', '10km', '25km'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusFilter(r)}
                className={`px-3 py-2 min-h-11 rounded-full text-xs font-bold ${radiusFilter === r ? h.chipActive : h.chipInactive}`}
              >
                {r === 'Any' ? t('Οποιαδήποτε', 'Any') : r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FilterBottomSheet>
  );
}
