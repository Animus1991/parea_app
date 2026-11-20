import { useRef, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  BadgeCheck, Bell, Bookmark, CreditCard, Grid, HelpCircle, History, Library,
  MapPin, Calendar, MessageSquare, Newspaper, Settings, ShieldCheck, Terminal,
  TrendingUp, Trophy, UserPlus, Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { useStore } from '../../store';
import { isOrganizerUser, isPlatformAdmin } from '../../lib/roles';
import { prefetchPath } from '../../lib/routeLoaders';
import {
  BOTTOM_SWIPE_QUICK_NAV_ENABLED,
  quickNavDestinations,
  type QuickNavTileDef,
} from '../../lib/bottomSwipeQuickNav';

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  categories: Grid,
  collections: Library,
  nearby: MapPin,
  agenda: Calendar,
  'buddy-seek': UserPlus,
  saved: Bookmark,
  history: History,
  wall: Newspaper,
  chats: MessageSquare,
  leaderboard: Trophy,
  challenges: Zap,
  manage: TrendingUp,
  wallet: CreditCard,
  notifications: Bell,
  settings: Settings,
  verification: BadgeCheck,
  trust: ShieldCheck,
  help: HelpCircle,
  admin: Terminal,
};

function Tile({
  tile,
  badge,
  onNavigate,
}: {
  tile: QuickNavTileDef;
  badge: number;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const Icon = ICONS[tile.id] ?? Grid;
  const label = t(tile.labelEl, tile.labelEn);
  const labelled = badge > 0 ? `${label} (${badge})` : label;

  return (
    <NavLink
      to={tile.path}
      aria-label={labelled}
      title={labelled}
      onClick={onNavigate}
      onTouchStart={() => prefetchPath(tile.path)}
      onFocus={() => prefetchPath(tile.path)}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl min-h-11 px-1 py-2 text-center transition-colors',
          isActive ? tok.navActive : tok.navInactive,
        )
      }
    >
      <span className="relative inline-flex">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
        {badge > 0 && (
          <span
            className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-2xs font-bold leading-none text-accent-fg tabular-nums"
            aria-hidden
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-xs font-medium leading-none line-clamp-2">{label}</span>
    </NavLink>
  );
}

export function BottomSwipeQuickNav({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const currentUser = useStore((s) => s.currentUser);
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayBehavior(true, onClose, panelRef);

  if (!BOTTOM_SWIPE_QUICK_NAV_ENABLED) return null;

  const tiles = quickNavDestinations({
    isAdmin: isPlatformAdmin(currentUser),
    isOrganizer: isOrganizerUser(currentUser),
  });

  return createPortal(
    <div
      className="md:hidden fixed inset-x-0 top-0 z-sheet"
      style={{ bottom: 'var(--bottom-nav-total)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-swipe-quick-nav-title"
      data-bottom-swipe-quick-nav="true"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('Κλείσιμο', 'Close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 motion-reduce:animate-none"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        data-bottom-swipe-sheet=""
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-x border-border bg-surface-raised text-ink shadow-soft-lg px-3 pt-2 pb-3 outline-none touch-none select-none',
          'animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
          tok.isDark ? 'border-gray-700' : 'border-gray-200',
        )}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden />
        <h2 id="bottom-swipe-quick-nav-title" className="sr-only">
          {t('Γρήγορη πρόσβαση', 'Quick access')}
        </h2>
        <div className="grid grid-cols-4 gap-1">
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              badge={0}
              onNavigate={onClose}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
