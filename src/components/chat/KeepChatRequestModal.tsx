import { useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#141820] border border-white/10 p-4 space-y-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold">{t('Διατήρηση συνομιλίας', 'Keep this chat')}</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          {t(
            'Απαιτείται αμοιβαία ή ομαδική συναίνεση. Θα σταλεί σύστημα μήνυμα στα μέλη.',
            'Requires mutual or group approval. A system message will be sent to members.',
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!viewer) return;
              requestKeepChat(conversationId, viewer.id);
              toast.success(t('Αίτημα διατήρησης εστάλη', 'Keep request sent'));
              onClose();
            }}
            className={cn('flex-1 min-h-10 rounded-xl text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500')}
          >
            {t('Αίτημα διατήρησης', 'Request to keep')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-10 rounded-xl text-[11px] font-bold border border-white/15"
          >
            {t('Άκυρο', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
