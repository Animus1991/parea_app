import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { Modal } from '../common/Modal';

export function KeepChatRequestModal({
  open,
  onClose,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}) {
  const { t } = useLanguage();
  const viewer = useStore((s) => s.currentUser);
  const requestKeepChat = useChatStore((s) => s.requestKeepChat);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Διατήρηση συνομιλίας', 'Keep this chat')}
      size="sm"
      className="p-4"
    >
      <p className="text-xs text-ink-muted leading-relaxed mb-3">
        {t(
          'Απαιτείται αμοιβαία ή ομαδική συναίνεση. Θα σταλεί σύστημα μήνυμα στα μέλη.',
          'Requires mutual or group approval. A system message will be sent to members.',
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          data-autofocus
          onClick={() => {
            if (!viewer) return;
            requestKeepChat(conversationId, viewer.id);
            toast.success(t('Αίτημα διατήρησης εστάλη', 'Keep request sent'));
            onClose();
          }}
          className={cn('flex-1 min-h-10 rounded-xl text-xs font-bold bg-brand hover:bg-brand-strong text-brand-fg')}
        >
          {t('Αίτημα διατήρησης', 'Request to keep')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 min-h-10 rounded-xl text-xs font-bold border border-border-strong"
        >
          {t('Άκυρο', 'Cancel')}
        </button>
      </div>
    </Modal>
  );
}
