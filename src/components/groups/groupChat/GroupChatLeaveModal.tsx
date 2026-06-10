import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="modal-panel max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#111827] mb-2">
          {t('Αποχώρηση από την ομάδα;', 'Leave Group?')}
        </h3>
        <p className="text-xs font-medium leading-relaxed text-gray-500 mb-6">
          {t('Είστε σίγουροι ότι θέλετε να αποχωρήσετε από', 'Are you sure you want to leave')}{' '}
          <span className="font-bold text-gray-700">{eventTitle}</span>?{' '}
          {t(
            'Μπορεί να μην μπορέσετε να ξαναμπείτε εάν η ομάδα γεμίσει.',
            'You might not be able to rejoin if the group is full.',
          )}
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full px-4 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98]"
          >
            {t('Ναι, Αποχώρηση', 'Yes, Leave Group')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-100 active:scale-[0.98]"
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
