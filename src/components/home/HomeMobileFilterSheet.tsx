import { Crown } from 'lucide-react';
import { FilterBottomSheet } from '../common/FilterBottomSheet';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { HOME_CATEGORIES, HOME_POPULAR_TAGS } from '../../lib/homeFeedConstants';
import { getHomeCategoryTranslations, getHomeTagTranslations } from '../../lib/homeCategoryLabels';
import { MoodSelector } from './MoodSelector';
import { HomeScheduleFilterPanel } from './HomeScheduleFilterPanel';
import { cn } from '../../lib/utils';
import type { HomeScheduleFilter } from '../../lib/homeScheduleFilter';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
  HomeSortParam,
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
  safetyFilter: HomeSafetyFilter;
  setSafetyFilter: (v: HomeSafetyFilter) => void;
  sortParam: HomeSortParam;
  setSortParam: (v: HomeSortParam) => void;
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
  showSeekingHostChip: boolean;
  activeCategory: string;
  setActiveCategory: (v: string) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  activeMood: string | null;
  onSelectMood: (moodId: string | null, categories: string[]) => void;
  schedule: HomeScheduleFilter;
  setSchedule: (next: HomeScheduleFilter) => void;
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
  safetyFilter,
  setSafetyFilter,
  sortParam,
  setSortParam,
  seekingHostOnly,
  onToggleSeekingHostOnly,
  showSeekingHostChip,
  activeCategory,
  setActiveCategory,
  tagFilter,
  setTagFilter,
  activeMood,
  onSelectMood,
  schedule,
  setSchedule,
}: HomeMobileFilterSheetProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const categoryTranslations = getHomeCategoryTranslations(t);
  const tagTranslations = getHomeTagTranslations(t);
  const chip = (on: boolean) =>
    cn('px-3 min-h-8 rounded-full text-xs font-bold', on ? h.chipActive : h.chipInactive);

  return (
    <FilterBottomSheet
      open={open}
      onClose={onClose}
      activeCount={activeCount}
      onClear={onClear}
    >
      <div className="space-y-4">
        <HomeScheduleFilterPanel schedule={schedule} onChange={setSchedule} />
        <MoodSelector activeMood={activeMood} onSelectMood={onSelectMood} />

        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Κατηγορία', 'Category')}</p>
          <div className="flex flex-wrap gap-2">
            {HOME_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={chip(activeCategory === cat)}
              >
                {categoryTranslations[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Ετικέτες', 'Tags')}</p>
          <div className="flex flex-wrap gap-2">
            {HOME_POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={chip(tagFilter === tag)}
              >
                {tagTranslations[tag] ?? tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Τιμή', 'Price')}</p>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Free', 'Paid', 'Group Discount'] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriceFilter(p)} className={chip(priceFilter === p)}>
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
              <button key={d} type="button" onClick={() => setDateFilter(d)} className={chip(dateFilter === d)}>
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
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Χώρος', 'Venue')}</p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'All' as const, el: 'Όλοι οι χώροι', en: 'All venues' },
              { value: 'low' as const, el: 'Δημόσιοι χώροι', en: 'Public spots' },
              { value: 'medium' as const, el: 'Οργανωμένοι hosts', en: 'Organized hosts' },
              { value: 'high_trust' as const, el: 'Επαληθευμένες ομάδες', en: 'Verified groups' },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setSafetyFilter(opt.value)} className={chip(safetyFilter === opt.value)}>
                {t(opt.el, opt.en)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Απόσταση', 'Distance')}</p>
          <div className="flex flex-wrap gap-2">
            {(['Any', '5km', '10km', '25km'] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRadiusFilter(r)} className={chip(radiusFilter === r)}>
                {r === 'Any' ? t('Οποιαδήποτε', 'Any') : r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs font-bold mb-2 ${h.labelMuted}`}>{t('Ταξινόμηση', 'Sort')}</p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'Distance' as const, el: 'Απόσταση', en: 'Distance' },
              { value: 'Relevance' as const, el: 'Συνάφεια', en: 'Relevance' },
              { value: 'Group Progress' as const, el: 'Πρόοδος ομάδας', en: 'Group progress' },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setSortParam(opt.value)} className={chip(sortParam === opt.value)}>
                {t(opt.el, opt.en)}
              </button>
            ))}
          </div>
        </div>
        {showSeekingHostChip && (
          <button
            type="button"
            onClick={onToggleSeekingHostOnly}
            className={cn(chip(seekingHostOnly), 'inline-flex items-center gap-1.5')}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {t('Χωρίς διοργανωτή', 'Seeking organizer')}
          </button>
        )}
      </div>
    </FilterBottomSheet>
  );
}
