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
        'fixed z-[60] flex items-center gap-2 rounded-full shadow-lg border min-h-12 px-4',
        'bg-[#0c1016] border-cyan-600/40 text-white hover:border-cyan-500/60 transition-colors',
        'bottom-20 right-4 md:bottom-6 md:right-6',
        'max-md:bottom-[5.5rem]',
        className,
      )}
    >
      <span className="relative">
        <MessageCircle className="w-5 h-5 text-cyan-400" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-cyan-500 text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      <span className="text-[12px] font-bold hidden sm:inline">{t('Συνομιλίες', 'Chats')}</span>
      {activeCount > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-200 hidden sm:inline">
          {activeCount} {t('ανοιχτές', 'open')}
        </span>
      )}
    </button>
  );
}
