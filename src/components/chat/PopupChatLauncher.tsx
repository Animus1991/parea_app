import { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';

export function PopupChatLauncher({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useLanguage();
  const conversations = useChatStore((s) => s.conversations);
  const unread = useMemo(
    () => conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0),
    [conversations],
  );
  const activeCount = useChatStore((s) => s.activeWindowIds.length);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('Συνομιλίες σχεδίων', 'Plan chats')}
      className={cn(
        'fixed z-chat flex items-center gap-2 rounded-full shadow-round-lg border min-h-8 px-4',
        'bg-surface border-brand/40 text-ink hover:border-brand/60 transition-colors',
        'bottom-nav-clear right-4 md:bottom-6 md:right-6 copilot-shift',
        className,
      )}
    >
      <span className="relative">
        <MessageCircle className="w-5 h-5 text-brand" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      <span className="text-xs font-bold hidden sm:inline">{t('Συνομιλίες', 'Chats')}</span>
      {activeCount > 0 && (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg bg-ink/10 text-brand hidden sm:inline">
          {activeCount} {t('ανοιχτές', 'open')}
        </span>
      )}
    </button>
  );
}
