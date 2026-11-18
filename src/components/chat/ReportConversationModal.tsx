import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';
import { Modal } from '../common/Modal';

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Αναφορά συνομιλίας', 'Report conversation')}
      size="sm"
      className="p-4"
    >
      <ul className="space-y-1 max-h-48 overflow-y-auto mb-3">
        {REASONS.map((r) => (
          <li key={r.en}>
            <label className="flex items-center gap-2 text-xs py-2 cursor-pointer text-ink">
              <input type="radio" name="reason" checked={reason === r.en} onChange={() => setReason(r.en)} />
              {t(r.el, r.en)}
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-autofocus
        onClick={() => {
          report(conversationId, reason);
          toast.success(t('Η αναφορά υποβλήθηκε', 'Report submitted'));
          onClose();
        }}
        className={cn('w-full min-h-9 rounded-full text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white mb-1')}
      >
        {t('Υποβολή αναφοράς', 'Submit report')}
      </button>
      <button type="button" onClick={onClose} className="w-full min-h-9 rounded-full text-xs text-ink-muted">
        {t('Άκυρο', 'Cancel')}
      </button>
    </Modal>
  );
}
