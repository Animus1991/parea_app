import { useEffect } from 'react';
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

  return (
    <>
      <PopupChatLauncher onClick={toggleInbox} />
      {inboxOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[68] bg-black/40 md:bg-transparent"
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
