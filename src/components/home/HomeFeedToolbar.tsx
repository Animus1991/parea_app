import { Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

const TOOLBAR_CHIP =
  'filter-chip text-xs font-bold leading-none px-3 gap-1.5 rounded-full border shrink-0 whitespace-nowrap';
const TOOLBAR_ICON = 'size-3.5 shrink-0';

export interface HomeFeedToolbarProps {
  feedType: 'For You' | 'Discover';
  setFeedType: (v: 'For You' | 'Discover') => void;
  resultCount: number;
  isLoading: boolean;
  tabWrapClassName?: string;
  tabClassName: (active: boolean) => string;
  mapClassName: string;
  actionsWrapClassName?: string;
  filtersOpen?: boolean;
  onToggleFilters?: () => void;
  activeFilterCount?: number;
}

export function HomeFeedToolbar({
  feedType,
  setFeedType,
  resultCount,
  isLoading,
  tabWrapClassName,
  tabClassName,
  mapClassName,
  actionsWrapClassName,
  filtersOpen = false,
  onToggleFilters,
  activeFilterCount = 0,
}: HomeFeedToolbarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className={cn('flex items-center gap-2', tabWrapClassName)}>
          <button
            type="button"
            onClick={() => setFeedType('For You')}
            className={tabClassName(feedType === 'For You')}
          >
            {t('home.feed.for_you', 'Για Σένα')}
          </button>
          <button
            type="button"
            onClick={() => setFeedType('Discover')}
            className={tabClassName(feedType === 'Discover')}
          >
            {t('home.feed.discover', 'Όλες')}
          </button>
        </div>
        {!isLoading && resultCount > 0 && (
          <p className="hidden h-[1.75rem] items-center text-xs font-semibold leading-none text-ink-muted whitespace-nowrap sm:inline-flex">
            {resultCount === 1
              ? t('1 αποτέλεσμα', '1 result')
              : t(`${resultCount} αποτελέσματα`, `${resultCount} results`)}
          </p>
        )}
      </div>

      <div className={cn('flex shrink-0 items-center gap-2', actionsWrapClassName)}>
        {onToggleFilters && (
          <button
            type="button"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            aria-controls="home-filters"
            className={cn(
              TOOLBAR_CHIP,
              filtersOpen
                ? 'border-accent bg-accent text-accent-fg'
                : mapClassName,
            )}
            title={t('Φίλτρα αναζήτησης', 'Search filters')}
            aria-label={t('Φίλτρα αναζήτησης', 'Search filters')}
          >
            <SlidersHorizontal className={TOOLBAR_ICON} aria-hidden />
            <span>{t('Φίλτρα', 'Filters')}</span>
            {activeFilterCount > 0 && (
              <span
                className={cn(
                  'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-count font-bold leading-none',
                  filtersOpen ? 'bg-accent-fg/20 text-accent-fg' : 'bg-accent text-accent-fg',
                )}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/nearby')}
          className={cn(TOOLBAR_CHIP, mapClassName)}
          title={t('Άνοιγμα χάρτη', 'Open Map')}
          aria-label={t('Άνοιγμα χάρτη', 'Open Map')}
        >
          <MapIcon className={TOOLBAR_ICON} aria-hidden />
          <span>{t('Χάρτης', 'Map')}</span>
        </button>
      </div>
    </div>
  );
}
