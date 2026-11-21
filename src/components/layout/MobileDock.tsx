import { useEffect, useMemo, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { MessageCircle, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { hidesFindCompanyShortcut } from '../../lib/plansFormingRail';
import { cn } from '../../lib/utils';

/**
 * Phones only: one floating pill for "Plans forming" and "Chats",
 * instead of two separate floating buttons. Both actions stay one tap away.
 */
const DOCK_HIDDEN = ['/chat', '/create', '/manage', '/report', '/settings', '/verification', '/onboarding', '/night', '/i', '/login', '/embed', '/wall'];

export function MobileDock() {
  const { t } = useLanguage();
  const setPlansOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const toggleInbox = useChatStore((s) => s.toggleInbox);
  const conversations = useChatStore((s) => s.conversations);
  const unread = useMemo(
    () => conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),
    [conversations],
  );
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

  // Scrolling down shrinks the pill to its icons; scrolling up brings the labels back.
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

  const segment =
    'flex items-center gap-2 min-h-11 font-bold text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-fg/70 transition-colors';

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
        {showPlans && (
          <>
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              aria-label={t('Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου', 'Find company now — small outings next to you')}
              className={cn(segment, 'pl-4 pr-3 active:bg-black/10')}
            >
              <Users className="w-4 h-4" aria-hidden />
              {!compact && <span className="whitespace-nowrap">{plans.label}</span>}
            </button>
            <span aria-hidden className="w-px my-2.5 bg-accent-fg/30" />
          </>
        )}
        <button
          type="button"
          onClick={toggleInbox}
          aria-label={
            unread > 0
              ? t(`${unread} αδιάβαστες συνομιλίες`, `${unread} unread chats`)
              : t('Συνομιλίες σχεδίων', 'Plan chats')
          }
          title={
            unread > 0
              ? t(`${unread} αδιάβαστες συνομιλίες`, `${unread} unread chats`)
              : t('Συνομιλίες', 'Chats')
          }
          className={cn(segment, showPlans ? 'pl-3 pr-4' : 'px-4', 'active:bg-black/10')}
        >
          <span className="relative shrink-0">
            <MessageCircle className="w-4 h-4" aria-hidden />
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute -top-1.5 -right-2 min-w-[1.05rem] h-4 px-1 rounded-full bg-accent-fg text-accent text-2xs font-bold leading-4 text-center tabular-nums"
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          {!compact && <span className="whitespace-nowrap">{t('Συνομιλίες', 'Chats')}</span>}
        </button>
      </div>
    </div>
  );
}
