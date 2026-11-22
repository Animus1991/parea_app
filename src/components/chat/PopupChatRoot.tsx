import { Suspense, lazy, useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { popupDockRightCss, POPUP_MD_PX } from '../../lib/popupChatLayout';
import { useChatStore } from '../../store/chatStore';
import { useFittedOpenConversation } from '../../hooks/useFittedOpenConversation';
import { useViewportWidth } from '../../hooks/useViewportWidth';
import { PopupChatLauncher } from './PopupChatLauncher';

const ChatInboxPanel = lazy(() =>
  import('./ChatInboxPanel').then((m) => ({ default: m.ChatInboxPanel })),
);
const ChatWindow = lazy(() =>
  import('./ChatWindow').then((m) => ({ default: m.ChatWindow })),
);

export function PopupChatRoot() {
  const { t } = useLanguage();
  const inboxOpen = useChatStore((s) => s.inboxOpen);
  const toggleInbox = useChatStore((s) => s.toggleInbox);
  const setInboxOpen = useChatStore((s) => s.setInboxOpen);
  const activeWindowIds = useChatStore((s) => s.activeWindowIds);
  const minimizedIds = useChatStore((s) => s.minimizedIds);
  const fitActiveWindowsToViewport = useChatStore((s) => s.fitActiveWindowsToViewport);
  const openConversation = useFittedOpenConversation();
  const conversations = useChatStore((s) => s.conversations);
  const vw = useViewportWidth();
  const pathname = useLocation().pathname;
  // On a group chat page the composer sits at the bottom: float above it.
  const onChatPage = pathname.startsWith('/chat/');
  const onEventDetail = Boolean(matchPath('/events/:eventId', pathname));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.chatHat = onChatPage ? 'composer' : onEventDetail ? 'event' : 'default';
    return () => {
      delete root.dataset.chatHat;
    };
  }, [onChatPage, onEventDetail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setInboxOpen]);

  useEffect(() => {
    fitActiveWindowsToViewport(vw);
  }, [vw, activeWindowIds, fitActiveWindowsToViewport]);

  const windows = activeWindowIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const minimized = minimizedIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  // Web popups stand side by side from the right (360px, one 22.5rem step each).
  // Show only as many as fit the screen; the rest wait as restore chips, like
  // minimized ones, and one tap brings a chat to the front.
  const fit = usePopupsThatFit(windows.length, minimized.length);
  const shown = windows.slice(-fit);
  const parked = windows.slice(0, windows.length - shown.length);
  const chips = [...parked, ...minimized];

  const desktopStack = vw >= POPUP_MD_PX && shown.length > 0;
  const dockRight = desktopStack ? popupDockRightCss(shown.length) : undefined;
  // Phone sheets fill the screen; the hat would cover the composer. Web popups
  // park the hat to the left of the stack so it stays a way to open more chats.
  const hideHat = onChatPage || inboxOpen || (windows.length > 0 && vw < POPUP_MD_PX);

  return (
    <>
      {chips.length > 0 && (
        <div
          data-chat-restore-dock=""
          style={dockRight ? { right: dockRight } : undefined}
          className={
            desktopStack
              ? 'chat-above-hat fixed z-modal-high flex flex-col items-end gap-2 copilot-shift'
              : 'chat-above-hat fixed z-chat flex flex-col items-end gap-2 right-4 md:right-6 copilot-shift'
          }
        >
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              title={t('Επαναφορά συνομιλίας', 'Restore conversation')}
              aria-label={`${t('Επαναφορά συνομιλίας', 'Restore conversation')}: ${c.title}`}
              className="flex items-center gap-2 max-w-[200px] rounded-full border border-brand/40 bg-surface text-ink shadow-soft-lg pl-3 pr-2.5 py-1.5 hover:border-brand/60 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0 text-brand" />
              <span className="text-xs font-bold truncate">{c.title}</span>
              {c.unreadCount > 0 && (
                <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand text-brand-fg text-count font-bold flex items-center justify-center px-1">
                  {c.unreadCount > 9 ? '9+' : c.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {!hideHat && (
        <PopupChatLauncher onClick={toggleInbox} dockRight={dockRight} raise={desktopStack} />
      )}
      {inboxOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-chat-scrim bg-black/40 md:bg-transparent"
            aria-label={t('Κλείσιμο εισερχομένων', 'Close inbox overlay')}
            onClick={() => setInboxOpen(false)}
          />
          <Suspense fallback={null}>
            <ChatInboxPanel onClose={() => setInboxOpen(false)} />
          </Suspense>
        </>
      )}
      {windows.length > 0 && (
        <Suspense fallback={null}>
          {shown.map((c, i) => (
            <ChatWindow key={c.id} conversation={c} stackIndex={i} />
          ))}
        </Suspense>
      )}
    </>
  );
}

const POPUP_WIDTH_PX = 360;
const POPUP_STEP_REM = 22.5;
const POPUP_EDGE_REM = 1.5;

const CHIP_ROOM_PX = 208;

/**
 * How many side-by-side chat popups fit the window (phones stack them full
 * screen). When some chats wait as restore chips, room is kept for them.
 */
function usePopupsThatFit(count: number, minimizedCount: number): number {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (width < 768) return count;
  const rem = typeof document === 'undefined' ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const fitIn = (room: number) => Math.max(1, Math.floor(room / (POPUP_STEP_REM * rem)) + 1);
  const room = width - POPUP_EDGE_REM * rem - POPUP_WIDTH_PX;
  const all = fitIn(room);
  const chips = minimizedCount > 0 || count > all;
  return chips ? fitIn(room - CHIP_ROOM_PX) : all;
}
