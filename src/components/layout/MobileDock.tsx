import { useEffect, useMemo, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { Inbox, MessageCircle, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { cn } from '../../lib/utils';

/**
 * Phones only: one floating pill for "Plans forming" and "Chats",
 * instead of two separate floating buttons. Both actions stay one tap away.
 */
export function MobileDock() {
  const { t } = useLanguage();
  const tok = useThemeStyles();
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

  // A group chat owns the bottom of the screen (composer); chats are one tap back.
  if (pathname.startsWith('/chat/')) return null;

  const segment =
    'flex items-center gap-2 min-h-11 font-bold text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 transition-colors';

  return (
    <div
      role="group"
      aria-label={t('Γρήγορη πρόσβαση', 'Quick access')}
      aria-hidden={waiting || undefined}
      inert={waiting || undefined}
      className={cn(
        'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
        waiting && 'opacity-0 translate-y-3 pointer-events-none',
        'mobile-dock md:hidden fixed left-1/2 -translate-x-1/2 z-fab flex items-stretch rounded-full shadow-soft-lg border overflow-hidden text-white',
        aboveEventBar
          ? 'bottom-[calc(var(--bottom-nav-total)+5.25rem+env(safe-area-inset-bottom,0px))]'
          : 'bottom-fab-zone',
        plans.visible && plans.hasPending
          ? 'bg-amber-500 border-amber-400'
          : tok.isDark
            ? 'bg-cyan-600 border-cyan-500'
            : 'bg-cyan-600 border-cyan-700',
      )}
    >
      {plans.visible && (
        <>
          <button
            type="button"
            onClick={() => setPlansOpen(true)}
            aria-label={
              plans.badge != null
                ? t(`Βρες Nakamas — ${plans.badge} συμβατά σχέδια`, `Find Nakamas — ${plans.badge} matching plans`)
                : t('Βρες Nakamas — σχέδια που σχηματίζονται', 'Find Nakamas — plans forming')
            }
            className={cn(segment, 'pl-4 pr-3 active:bg-black/10')}
          >
            {plans.hasPending ? <Inbox className="w-4 h-4" aria-hidden /> : <Users className="w-4 h-4" aria-hidden />}
            <span className="whitespace-nowrap">{plans.label}</span>
            {plans.badge != null && (
              <span
                className={cn(
                  'bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center',
                  plans.hasPending && 'animate-pulse motion-reduce:animate-none',
                )}
              >
                {plans.badge}
              </span>
            )}
          </button>
          <span aria-hidden className="w-px my-2.5 bg-white/30" />
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
        className={cn(segment, plans.visible ? 'pl-3 pr-4' : 'px-4', 'active:bg-black/10')}
      >
        <MessageCircle className="w-4 h-4" aria-hidden />
        {unread > 0 ? (
          <span className="whitespace-nowrap">
            {unread > 9 ? '9+' : unread} {t('αδιάβαστα', 'unread')}
          </span>
        ) : (
          <span className="whitespace-nowrap">{t('Συνομιλίες', 'Chats')}</span>
        )}
      </button>
    </div>
  );
}
