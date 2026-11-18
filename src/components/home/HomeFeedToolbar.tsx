import { Map as MapIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export interface HomeFeedToolbarProps {
  feedType: 'For You' | 'Discover';
  setFeedType: (v: 'For You' | 'Discover') => void;
  resultCount: number;
  isLoading: boolean;
  tabWrapClassName?: string;
  tabClassName: (active: boolean) => string;
  mapClassName: string;
}

export function HomeFeedToolbar({
  feedType,
  setFeedType,
  resultCount,
  isLoading,
  tabWrapClassName,
  tabClassName,
  mapClassName,
}: HomeFeedToolbarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className={cn('flex gap-2', tabWrapClassName)}>
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
            {t('home.feed.discover', 'Ανακάλυψε')}
          </button>
        </div>
        {!isLoading && resultCount > 0 && (
          <p className="text-xs font-semibold text-ink-muted">
            {resultCount === 1
              ? t('1 αποτέλεσμα', '1 result')
              : t(`${resultCount} αποτελέσματα`, `${resultCount} results`)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/nearby')}
        className={cn(
          'inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 transition-colors',
          mapClassName,
        )}
        title={t('Άνοιγμα Χάρτη', 'Open Map')}
        aria-label={t('Άνοιγμα Χάρτη', 'Open Map')}
      >
        <MapIcon className="w-4 h-4" aria-hidden />
        <span className="text-xs font-bold">{t('Χάρτης', 'Map')}</span>
      </button>
    </div>
  );
}
