import { Suspense, lazy, useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { PopupChatLauncher } from './PopupChatLauncher';
import { ChatHatPicker } from './ChatHatPicker';

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
  const openConversation = useChatStore((s) => s.openConversation);
  const conversations = useChatStore((s) => s.conversations);
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

  const windows = activeWindowIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const minimized = minimizedIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <>
      {minimized.length > 0 && (
        <div className="chat-above-hat fixed z-chat flex flex-col items-end gap-2 right-4 md:right-6 copilot-shift">
          {minimized.map((c) => (
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
                <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-brand text-brand-fg text-2xs font-bold flex items-center justify-center px-1">
                  {c.unreadCount > 9 ? '9+' : c.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {!(onChatPage || inboxOpen || windows.length > 0) && (
        <>
          <ChatHatPicker />
          <PopupChatLauncher onClick={toggleInbox} />
        </>
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
          {windows.map((c, i) => (
            <ChatWindow key={c.id} conversation={c} stackIndex={i} />
          ))}
        </Suspense>
      )}
    </>
  );
}
