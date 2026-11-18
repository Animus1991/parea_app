import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

type MenuBox = { top: number; left: number; width: number; maxHeight: number };

function measureAnchor(anchor: HTMLElement): MenuBox {
  const r = anchor.getBoundingClientRect();
  const vv = window.visualViewport;
  const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const maxHeight = Math.max(140, viewBottom - r.bottom - 12);
  return {
    top: r.bottom + 8,
    left: r.left,
    width: Math.max(r.width, 220),
    maxHeight,
  };
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
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<MenuBox | null>(null);

  const open = show && !(hideWhenQuery && searchQuery);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      document.body.removeAttribute('data-search-open');
      return;
    }
    const anchor = sentinelRef.current?.parentElement;
    if (!anchor) return;

    const update = () => setBox(measureAnchor(anchor));
    update();
    document.body.setAttribute('data-search-open', '1');

    const main = document.getElementById('main-content');
    main?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      main?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      document.body.removeAttribute('data-search-open');
    };
  }, [open]);

  if (!open) return <span ref={sentinelRef} className="hidden" />;

  const hasRecent = recentSearches.length > 0;

  const menu = box ? (
    <div
      data-home-search-menu
      role="listbox"
      aria-label={t('Προτάσεις αναζήτησης', 'Search suggestions')}
      style={{
        position: 'fixed',
        top: box.top,
        left: box.left,
        width: box.width,
        maxHeight: box.maxHeight,
        zIndex: 100,
      }}
      className={cn(
        'z-modal overflow-y-auto overscroll-contain rounded-2xl shadow-soft-lg border',
        h.heroSearchDropdown,
      )}
    >
      {hasRecent && (
        <>
          <div className="px-3 pt-2 pb-1">
            <span
              className={cn(
                'text-xs font-bold tracking-widest flex items-center gap-1',
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
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(s)}
              className={cn(
                'w-full text-left px-4 min-h-8 py-2 text-sm font-medium transition-colors flex items-center gap-2',
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
      <div className={cn('px-3 pt-2 pb-1', hasRecent && 'border-t border-black/10')}>
        <span className={cn('text-xs font-bold tracking-widest', h.heroSearchDropdownLabel)}>
          {t('Δημοφιλείς Αναζητήσεις', 'Popular Searches')}
        </span>
      </div>
      {popularSuggestions.map((s) => (
        <button
          key={`popular-${s}`}
          type="button"
          role="option"
          aria-selected={false}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(s)}
          className={cn(
            'w-full text-left px-4 min-h-8 py-2 text-sm font-medium transition-colors flex items-center gap-2',
            h.heroSearchItem,
            h.heroSearchItemHover,
          )}
        >
          <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
          {s}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <span ref={sentinelRef} className="hidden" />
      {menu && createPortal(menu, document.body)}
    </>
  );
}
