import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { KeepChatRequestModal } from './KeepChatRequestModal';
import { cn } from '../../lib/utils';

export function EphemeralChatBanner({
  conversationId,
  className,
}: {
  conversationId: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const dismissedIds = useChatStore((s) => s.dismissedEphemeralBanners);
  const dismissed = dismissedIds.includes(conversationId);
  const dismiss = useChatStore((s) => s.dismissEphemeralBanner);
  const undismiss = useChatStore((s) => s.undismissEphemeralBanner);
  const [keepOpen, setKeepOpen] = useState(false);
  if (dismissed) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1 border-b border-border/80 text-2xs text-ink-muted',
          className,
        )}
      >
        <p className="min-w-0 flex-1 truncate leading-snug">
          {t('Προσωρινό · 24ω μετά την εκδήλωση', 'Temporary · 24h after the event')}
        </p>
        <button
          type="button"
          onClick={() => setKeepOpen(true)}
          className="shrink-0 font-medium text-ink hover:underline"
        >
          {t('Διατήρηση', 'Keep')}
        </button>
        <button
          type="button"
          onClick={() => {
            dismiss(conversationId);
            toast.info(t('Η ειδοποίηση αποκρύφθηκε', 'Banner dismissed'), {
              action: {
                label: t('Αναίρεση', 'Undo'),
                onClick: () => undismiss(conversationId),
              },
            });
          }}
          aria-label={t('Απόκρυψη', 'Dismiss')}
          className="shrink-0 p-0.5 rounded-full hover:bg-ink/5"
        >
          <X className="w-3 h-3 text-ink-muted" />
        </button>
      </div>
      <KeepChatRequestModal open={keepOpen} onClose={() => setKeepOpen(false)} conversationId={conversationId} />
    </>
  );
}
