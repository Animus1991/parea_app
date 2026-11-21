import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { Modal } from '../../common/Modal';

interface GroupChatLeaveModalProps {
  open: boolean;
  eventTitle?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function GroupChatLeaveModal({
  open,
  eventTitle,
  onClose,
  onConfirm,
}: GroupChatLeaveModalProps) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onClose} title={t('Αποχώρηση από την ομάδα;', 'Leave Group?')} size="sm">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <p className="text-xs font-medium leading-relaxed text-ink-muted mb-4">
          {t('Θέλεις σίγουρα να αποχωρήσεις από', 'Are you sure you want to leave')}{' '}
          <span className="font-bold text-ink">{eventTitle}</span>?{' '}
          {t(
            'Μπορεί να μην μπορέσεις να ξαναμπείς αν η ομάδα γεμίσει.',
            'You might not be able to rejoin if the group is full.',
          )}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            className="w-full px-4 py-2 min-h-9 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-soft active:scale-[0.98]"
          >
            {t('Ναι, αποχώρηση', 'Yes, Leave Group')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 min-h-9 text-xs font-bold text-ink bg-surface hover:bg-surface-raised rounded-full transition-all duration-200 border border-border active:scale-[0.98]"
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
