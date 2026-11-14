import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { PopupChatLauncher } from './PopupChatLauncher';
import { ChatInboxPanel } from './ChatInboxPanel';
import { ChatWindow } from './ChatWindow';

export function PopupChatRoot() {
  const { t } = useLanguage();
  const inboxOpen = useChatStore((s) => s.inboxOpen);
  const toggleInbox = useChatStore((s) => s.toggleInbox);
  const setInboxOpen = useChatStore((s) => s.setInboxOpen);
  const activeWindowIds = useChatStore((s) => s.activeWindowIds);
  const minimizedIds = useChatStore((s) => s.minimizedIds);
  const openConversation = useChatStore((s) => s.openConversation);
  const conversations = useChatStore((s) => s.conversations);

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
        <div className="fixed z-chat flex flex-col items-end gap-2 right-4 bottom-[calc(var(--safe-bottom)+3.5rem+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-20 copilot-shift">
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
      {/* Phones reach chats from the shared dock (layout/MobileDock). */}
      <PopupChatLauncher onClick={toggleInbox} className="hidden md:flex" />
      {inboxOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-chat-scrim bg-black/40 md:bg-transparent"
            aria-label={t('Κλείσιμο εισερχομένων', 'Close inbox overlay')}
            onClick={() => setInboxOpen(false)}
          />
          <ChatInboxPanel onClose={() => setInboxOpen(false)} />
        </>
      )}
      {windows.map((c, i) => (
        <ChatWindow key={c.id} conversation={c} stackIndex={i} />
      ))}
    </>
  );
}
