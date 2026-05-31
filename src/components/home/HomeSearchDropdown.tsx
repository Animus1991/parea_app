import { Clock, Search } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

export interface HomeSearchDropdownProps {
  popularSuggestions: string[];
  onPick: (value: string) => void;
  show: boolean;
  hideWhenQuery?: boolean;
  searchQuery?: string;
}

export function HomeSearchDropdown({
  popularSuggestions,
  onPick,
  show,
  hideWhenQuery = true,
  searchQuery = '',
}: HomeSearchDropdownProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const recentSearches = useStore((s) => s.recentSearches);

  if (!show || (hideWhenQuery && searchQuery)) return null;

  const hasRecent = recentSearches.length > 0;

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-50 overflow-hidden',
        h.heroSearchDropdown,
      )}
    >
      {hasRecent && (
        <>
          <div className="px-3 pt-2 pb-1">
            <span
              className={cn(
                'text-[10px] font-bold tracking-widest flex items-center gap-1',
                h.heroSearchDropdownLabel,
              )}
            >
              <Clock className="w-3 h-3 opacity-70" />
              {t('Πρόσφατες Αναζητήσεις', 'Recent Searches')}
            </span>
          </div>
          {recentSearches.map((s) => (
            <button
              key={`recent-${s}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(s)}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2',
                h.heroSearchItem,
                h.heroSearchItemHover,
              )}
            >
              <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
              {s}
            </button>
          ))}
        </>
      )}
      <div className={cn('px-3 pt-2 pb-1', hasRecent && 'border-t border-white/10')}>
        <span className={cn('text-[10px] font-bold tracking-widest', h.heroSearchDropdownLabel)}>
          {t('Δημοφιλείς Αναζητήσεις', 'Popular Searches')}
        </span>
      </div>
      {popularSuggestions.map((s) => (
        <button
          key={`popular-${s}`}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(s)}
          className={cn(
            'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2',
            h.heroSearchItem,
            h.heroSearchItemHover,
          )}
        >
          <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
          {s}
        </button>
      ))}
    </div>
  );
}
