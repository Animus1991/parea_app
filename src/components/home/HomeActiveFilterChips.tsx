import { X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { getHomeCategoryTranslations, getHomeTagTranslations } from '../../lib/homeCategoryLabels';
import { getHomeMoodById } from '../../lib/homeMoodConstants';
import type {
  HomeDateFilter,
  HomePriceFilter,
  HomeRadiusFilter,
  HomeSafetyFilter,
} from '../../lib/homeFeedConstants';

export interface HomeActiveFilterChipsProps {
  activeCategory: string;
  setActiveCategory: (v: string) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  priceFilter: HomePriceFilter;
  setPriceFilter: (v: HomePriceFilter) => void;
  dateFilter: HomeDateFilter;
  setDateFilter: (v: HomeDateFilter) => void;
  safetyFilter: HomeSafetyFilter;
  setSafetyFilter: (v: HomeSafetyFilter) => void;
  radiusFilter: HomeRadiusFilter;
  setRadiusFilter: (v: HomeRadiusFilter) => void;
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
  activeMood: string | null;
  onClearMood: () => void;
  onClearAll: () => void;
}

export function HomeActiveFilterChips({
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
  seekingHostOnly,
  onToggleSeekingHostOnly,
  activeMood,
  onClearMood,
  onClearAll,
}: HomeActiveFilterChipsProps) {
  const { t } = useLanguage();
  const categoryTranslations = getHomeCategoryTranslations(t);
  const tagTranslations = getHomeTagTranslations(t);
  const mood = getHomeMoodById(activeMood);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (activeMood && mood) {
    chips.push({ key: 'mood', label: t(mood.labelGr, mood.labelEn), onRemove: onClearMood });
  }
  if (activeCategory !== 'All') {
    chips.push({
      key: 'cat',
      label: categoryTranslations[activeCategory] ?? activeCategory,
      onRemove: () => setActiveCategory('All'),
    });
  }
  if (tagFilter !== 'All') {
    chips.push({
      key: 'tag',
      label: tagTranslations[tagFilter] ?? tagFilter,
      onRemove: () => setTagFilter('All'),
    });
  }
  if (dateFilter !== 'Any') {
    const dateLabel =
      dateFilter === 'Today'
        ? t('Σήμερα', 'Today')
        : dateFilter === 'This Week'
          ? t('Αυτή την εβδομάδα', 'This week')
          : t('Αυτόν τον μήνα', 'This month');
    chips.push({ key: 'date', label: dateLabel, onRemove: () => setDateFilter('Any') });
  }
  if (radiusFilter !== 'Any') {
    chips.push({
      key: 'radius',
      label: t('Κοντά μου', 'Near me') + (radiusFilter !== '10km' ? ` · ${radiusFilter}` : ''),
      onRemove: () => setRadiusFilter('Any'),
    });
  }
  if (priceFilter !== 'All') {
    const priceLabel =
      priceFilter === 'Free'
        ? t('Δωρεάν', 'Free')
        : priceFilter === 'Paid'
          ? t('Επί πληρωμή', 'Paid')
          : t('Ομαδική έκπτωση', 'Group discount');
    chips.push({ key: 'price', label: priceLabel, onRemove: () => setPriceFilter('All') });
  }
  if (safetyFilter !== 'All') {
    const safetyLabel =
      safetyFilter === 'low'
        ? t('Δημόσιοι χώροι', 'Public spots')
        : safetyFilter === 'medium'
          ? t('Οργανωμένοι hosts', 'Organized hosts')
          : t('Επαληθευμένες ομάδες', 'Verified groups');
    chips.push({ key: 'safety', label: safetyLabel, onRemove: () => setSafetyFilter('All') });
  }
  if (seekingHostOnly) {
    chips.push({
      key: 'host',
      label: t('Χωρίς διοργανωτή', 'Seeking organizer'),
      onRemove: onToggleSeekingHostOnly,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex min-h-8 items-center gap-1 rounded-full bg-ink text-white px-2.5 text-xs font-bold"
          aria-label={t(`Αφαίρεση φίλτρου ${chip.label}`, `Remove ${chip.label} filter`)}
        >
          {chip.label}
          <X className="w-3 h-3" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-bold text-red-500 px-1.5 min-h-8"
        >
          {t('Καθαρισμός', 'Clear')}
        </button>
      )}
    </div>
  );
}
