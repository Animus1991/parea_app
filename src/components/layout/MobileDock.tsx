import { useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { hidesFindCompanyShortcut } from '../../lib/plansFormingRail';
import { cn } from '../../lib/utils';

/**
 * Phones only: floating pill for nearby outings.
 * Plan chats live on the straw-hat FAB (PopupChatLauncher).
 */
const DOCK_HIDDEN = ['/chat', '/create', '/manage', '/report', '/settings', '/verification', '/onboarding', '/night', '/i', '/login', '/embed', '/wall'];

export function MobileDock() {
  const { t } = useLanguage();
  const setPlansOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const plans = usePlansFabState();
  // The event page has its own sticky Save / Find Nakamas bar: sit just above it.
  const { pathname } = useLocation();
  const aboveEventBar = Boolean(matchPath('/events/:eventId', pathname));
  // On the event page the dock waits until the title has scrolled away, so the
  // first glance shows the event and its action bar only.
  const [pastHeader, setPastHeader] = useState(false);
  useEffect(() => {
    setPastHeader(false);
    if (!aboveEventBar) return;
    const main = document.getElementById('main-content');
    if (!main) return;
    const onScroll = () => setPastHeader(main.scrollTop > 280);
    onScroll();
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [aboveEventBar, pathname]);
  const waiting = aboveEventBar && !pastHeader;

  // Scrolling down shrinks the pill to its icon; scrolling up brings the label back.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    setCompact(false);
    const main = document.getElementById('main-content');
    if (!main) return;
    let last = main.scrollTop;
    const onScroll = () => {
      const y = main.scrollTop;
      if (Math.abs(y - last) < 8) return;
      setCompact(y > last && y > 120);
      last = y;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Screens that own the bottom edge (composer, forms, primary actions) keep it clear.
  if (DOCK_HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  if (matchPath('/events/:eventId/join', pathname) || matchPath('/history/feedback/:eventId', pathname)) return null;
  // Overlay is nearby-now outings. My Plans already lists booked nights.
  const showPlans = plans.visible && !hidesFindCompanyShortcut(pathname);
  if (!showPlans) return null;

  return (
    <div
      className={cn(
        'mobile-dock md:hidden fixed left-1/2 -translate-x-1/2 z-fab shadow-round-lg',
        'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
        waiting && 'opacity-0 translate-y-3 pointer-events-none',
        aboveEventBar
          ? 'bottom-[calc(var(--bottom-nav-total)+5.25rem+env(safe-area-inset-bottom,0px))]'
          : 'bottom-fab-zone',
      )}
    >
      <div
        role="group"
        aria-label={t('Γρήγορη πρόσβαση', 'Quick access')}
        aria-hidden={waiting || undefined}
        inert={waiting || undefined}
        data-bottom-swipe-origin=""
        className="flex items-stretch overflow-hidden rounded-full border bg-accent text-accent-fg border-accent-strong touch-none"
      >
        <button
          type="button"
          onClick={() => setPlansOpen(true)}
          aria-label={t('Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου', 'Find company now — small outings next to you')}
          className="flex items-center gap-2 min-h-11 pl-4 pr-4 font-bold text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-fg/70 transition-colors active:bg-black/10"
        >
          <Users className="w-4 h-4" aria-hidden />
          {!compact && <span className="whitespace-nowrap">{plans.label}</span>}
        </button>
      </div>
    </div>
  );
}
