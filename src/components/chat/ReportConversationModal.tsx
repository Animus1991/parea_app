import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';

const REASONS = [
  { el: 'Παρενόχληση', en: 'Harassment' },
  { el: 'Ακατάλληλο περιεχόμενο', en: 'Inappropriate content' },
  { el: 'Spam', en: 'Spam' },
  { el: 'Πίεση / dating', en: 'Dating pressure' },
  { el: 'Άλλο', en: 'Other' },
];

export function ReportConversationModal({
  open,
  onClose,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}) {
  const { t } = useLanguage();
  const report = useChatStore((s) => s.reportConversation);
  const [reason, setReason] = useState(REASONS[0].en);

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
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#141820] border border-white/10 p-4 space-y-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold">{t('Αναφορά συνομιλίας', 'Report conversation')}</h3>
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {REASONS.map((r) => (
            <li key={r.en}>
              <label className="flex items-center gap-2 text-xs py-2 cursor-pointer">
                <input type="radio" name="reason" checked={reason === r.en} onChange={() => setReason(r.en)} />
                {t(r.el, r.en)}
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            report(conversationId, reason);
            toast.success(t('Η αναφορά υποβλήθηκε', 'Report submitted'));
            onClose();
          }}
          className={cn('w-full min-h-10 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-600')}
        >
          {t('Υποβολή αναφοράς', 'Submit report')}
        </button>
        <button type="button" onClick={onClose} className="w-full text-xs text-gray-500">
          {t('Άκυρο', 'Cancel')}
        </button>
      </div>
    </div>
  );
}
