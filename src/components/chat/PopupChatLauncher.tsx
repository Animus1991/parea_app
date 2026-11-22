import { useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { StrawHatSpin } from '../illustrations/StrawHatMark';
import { cn } from '../../lib/utils';
import { CHAT_HAT_FAB, chatHatById } from '../../lib/chatHatStyles';
import { useUIStore } from '../../store/uiStore';
import { useDraggableChatHat } from '../../hooks/useDraggableChatHat';

export function PopupChatLauncher({
  onClick,
  className,
  dockRight,
  raise,
}: {
  onClick: () => void;
  className?: string;
  dockRight?: string;
  raise?: boolean;
}) {
  const { t } = useLanguage();
  const inboxOpen = useChatStore((s) => s.inboxOpen);
  const hatStyleId = useUIStore((s) => s.chatHatStyle);
  const customChatHats = useUIStore((s) => s.customChatHats);
  const hatSrc = chatHatById(hatStyleId, customChatHats)?.src;
  const chatHatPos = useUIStore((s) => s.chatHatPos);
  const setChatHatPos = useUIStore((s) => s.setChatHatPos);
  const { pathname } = useLocation();
  const onEventDetail = Boolean(matchPath('/events/:eventId', pathname));
  const drag = useDraggableChatHat(chatHatPos, setChatHatPos, onEventDetail ? 'event' : 'default');
  const conversations = useChatStore((s) => s.conversations);
  const unread = useMemo(
    () => conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),
    [conversations],
  );
  const hideOnPhones =
    Boolean(matchPath('/events/:eventId/join', pathname)) ||
    Boolean(matchPath('/history/feedback/:eventId', pathname));

  return (
    <button
      type="button"
      onClick={(event) => {
        if (event.detail > 0 && drag.shouldIgnoreClick()) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick();
      }}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
      onKeyDown={drag.onKeyDown}
      aria-label={t('Συνομιλίες σχεδίων. Σύρε για μετακίνηση.', 'Plan chats. Drag to move.')}
      aria-expanded={inboxOpen}
      title={t('Σύρε για μετακίνηση · πάτησε για συνομιλίες', 'Drag to move · tap to open chats')}
      data-chat-hat-launcher=""
      data-placed={drag.placed ? '1' : undefined}
      style={
        drag.placed
          ? { left: drag.placed.left, top: drag.placed.top, right: 'auto', bottom: 'auto' }
          : dockRight
            ? { right: dockRight }
            : undefined
      }
      className={cn(
        'chat-hat-fab fixed z-chat-toggle inline-flex items-center justify-center p-0 m-0',
        'bg-transparent border-0 shadow-none rounded-full overflow-visible',
        'touch-none select-none cursor-grab',
        drag.dragging && 'cursor-grabbing scale-[1.04]',
        drag.placed ? 'right-auto bottom-auto' : dockRight ? 'copilot-shift' : 'right-3 md:right-6 copilot-shift',
        raise && 'z-modal-high',
        hideOnPhones && 'max-md:hidden',
        className,
      )}
    >
      <span className="relative inline-flex pointer-events-none">
        <StrawHatSpin
          open={inboxOpen}
          src={hatSrc}
          markClassName={cn(CHAT_HAT_FAB, 'drop-shadow-[0_8px_14px_rgba(63,42,27,0.4)]')}
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
