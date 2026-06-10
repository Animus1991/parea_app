import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { KeepChatRequestModal } from './KeepChatRequestModal';

export function EphemeralChatBanner({ conversationId }: { conversationId: string }) {
  const { t } = useLanguage();
  const dismissedIds = useChatStore((s) => s.dismissedEphemeralBanners);
  const dismissed = dismissedIds.includes(conversationId);
  const dismiss = useChatStore((s) => s.dismissEphemeralBanner);
  const [keepOpen, setKeepOpen] = useState(false);
  if (dismissed) return null;

  return (
    <>
      <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border border-cyan-500/25 bg-cyan-950/40 px-3 py-2 text-xs text-cyan-100">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="flex-1 leading-relaxed">
          {t(
            'Προσωρινό plan chat · διαθέσιμο έως 24ω μετά την εκδήλωση',
            'Temporary plan chat · available until 24h after the event',
          )}
        </p>
        <button
          type="button"
          onClick={() => setKeepOpen(true)}
          className="shrink-0 font-bold text-cyan-300 hover:underline"
        >
          {t('Διατήρηση', 'Keep')}
        </button>
        <button type="button" onClick={() => dismiss(conversationId)} aria-label={t('Απόκρυψη', 'Dismiss')}>
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
      <KeepChatRequestModal open={keepOpen} onClose={() => setKeepOpen(false)} conversationId={conversationId} />
    </>
  );
}
