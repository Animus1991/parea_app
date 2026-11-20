import { NavLink, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useBottomSwipeQuickNav } from '../../hooks/useBottomSwipeQuickNav';
import { useQuickNavLayout } from '../../hooks/useQuickNavLayout';
import { barCaption } from '../../lib/quickNavLayout';
import { quickNavIcon } from '../../lib/quickNavIcons';
import { prefetchPath } from '../../lib/routeLoaders';
import { BottomSwipeQuickNav } from './BottomSwipeQuickNav';
import type { QuickNavTileDef } from '../../lib/quickNavLayout';

function BarLink({ tile }: { tile: QuickNavTileDef }) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const Icon = quickNavIcon(tile.id);
  const caption = barCaption(tile);
  return (
    <NavLink
      to={tile.path}
      onTouchStart={() => prefetchPath(tile.path)}
      onFocus={() => prefetchPath(tile.path)}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px] min-h-11',
          isActive ? tok.navActive : tok.navInactive,
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-xs font-medium leading-none">{t(caption.el, caption.en)}</span>
    </NavLink>
  );
}

export function BottomNav() {
  const tok = useThemeStyles();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const swipe = useBottomSwipeQuickNav();
  const { bar } = useQuickNavLayout();
  if (pathname.startsWith('/chat/')) return null;

  const leftCount = Math.floor(bar.length / 2);
  const left = bar.slice(0, leftCount);
  const right = bar.slice(leftCount);

  return (
    <>
      <div
        ref={swipe.navRef}
        data-bottom-swipe-origin=""
        className={cn(
          'md:hidden fixed bottom-0 left-0 w-full backdrop-blur-md border-t px-2 pb-4 pt-3 flex items-center justify-around shadow-soft-up-lg z-bottomnav touch-none select-none [&_a]:[user-drag:none]',
          tok.bottomNav,
        )}
      >
        {left.map((tile) => (
          <BarLink key={tile.id} tile={tile} />
        ))}
        <div className="flex flex-col items-center justify-center -mt-4">
          <NavLink
            to="/create"
            aria-label={t('Δημιουργία εκδήλωσης', 'Create event')}
            className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2 border-white shadow-round', tok.fab)}
          >
            <Plus className="h-[20px] w-[20px] icon-emphasis" aria-hidden />
          </NavLink>
          <span aria-hidden className={cn('text-xs font-medium mt-1', tok.muted)}>
            {t('Δημιουργία', 'Create')}
          </span>
        </div>
        {right.map((tile) => (
          <BarLink key={tile.id} tile={tile} />
        ))}
      </div>
      {swipe.open && <BottomSwipeQuickNav onClose={swipe.close} />}
    </>
  );
}
