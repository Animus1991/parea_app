import { MessageSquareWarning } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export function ChatModerationPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const reports = useChatStore((s) => s.reports);
  const conversations = useChatStore((s) => s.conversations);

  return (
    <div className={cn('rounded-2xl border p-4 space-y-4 mt-8', a.cardSurface, a.borderB)}>
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="w-5 h-5 text-red-500" />
        <h2 className={cn('text-sm font-bold', a.head)}>{t('Nakamas Chat — moderation (mock)', 'Nakamas Chat — moderation (mock)')}</h2>
      </div>
      <p className={cn('text-[11px]', a.sub)}>
        {t('Αναφερμένες συνομιλίες από χρήστες · τοπική προσομοίωση', 'User-reported conversations · local simulation')}
      </p>
      <ul className="space-y-2 max-h-56 overflow-y-auto">
        {reports.length === 0 ? (
          <li className={cn('text-[12px]', a.sub)}>{t('Καμία αναφορά chat ακόμα.', 'No chat reports yet.')}</li>
        ) : (
          reports.map((r) => {
            const conv = conversations.find((c) => c.id === r.conversationId);
            return (
              <li key={r.id} className={cn('rounded-xl border p-3 text-[11px] space-y-1', a.borderB)}>
                <p className="font-bold">{conv?.title ?? r.conversationId}</p>
                <p className="opacity-70">{r.reason}</p>
                <p className="text-[10px] opacity-50">{r.status} · {new Date(r.createdAt).toLocaleString()}</p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
