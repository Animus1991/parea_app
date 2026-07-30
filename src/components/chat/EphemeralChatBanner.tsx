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
      <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border border-brand/25 bg-brand-soft px-3 py-2 text-xs text-ink">
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
          className="shrink-0 font-bold text-brand hover:underline"
        >
          {t('Διατήρηση', 'Keep')}
        </button>
        <button type="button" onClick={() => dismiss(conversationId)} aria-label={t('Απόκρυψη', 'Dismiss')}>
          <X className="w-3.5 h-3.5 text-ink-muted" />
        </button>
      </div>
      <KeepChatRequestModal open={keepOpen} onClose={() => setKeepOpen(false)} conversationId={conversationId} />
    </>
  );
}
