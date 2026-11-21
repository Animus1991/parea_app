import { useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { StrawHatSpin } from '../illustrations/StrawHatMark';
import { cn } from '../../lib/utils';

/** 4× the old 24px glyph, a bit more on desktop so the hat reads as the FAB. */
const HAT_FAB = 'w-24 h-24 md:w-28 md:h-28';

export function PopupChatLauncher({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useLanguage();
  const inboxOpen = useChatStore((s) => s.inboxOpen);
  const conversations = useChatStore((s) => s.conversations);
  const unread = useMemo(
    () => conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),
    [conversations],
  );
  const { pathname } = useLocation();
  const hideOnPhones =
    Boolean(matchPath('/events/:eventId/join', pathname)) ||
    Boolean(matchPath('/history/feedback/:eventId', pathname));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('Συνομιλίες σχεδίων', 'Plan chats')}
      aria-expanded={inboxOpen}
      className={cn(
        'chat-hat-fab fixed z-chat-toggle inline-flex items-center justify-center p-0 m-0',
        'bg-transparent border-0 shadow-none rounded-full overflow-visible',
        'right-3 md:right-6 copilot-shift',
        hideOnPhones && 'max-md:hidden',
        className,
      )}
    >
      <span className="relative inline-flex">
        <StrawHatSpin
          open={inboxOpen}
          markClassName={cn(HAT_FAB, 'drop-shadow-[0_8px_14px_rgba(63,42,27,0.4)]')}
        />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
    </button>
  );
}
