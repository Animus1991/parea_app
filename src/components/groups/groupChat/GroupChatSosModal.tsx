import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import type { Group } from '../../../types';

interface GroupChatSosModalProps {
  open: boolean;
  group: Group;
  currentUserId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function GroupChatSosModal({
  open,
  group,
  currentUserId,
  onClose,
  onConfirm,
}: GroupChatSosModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  const isSos = Boolean(group.membersLocations?.[currentUserId]?.sos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-red-100 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-[#111827] mb-2">
          {isSos ? t('Απενεργοποίηση SOS', 'Deactivate SOS') : t('Ενεργοποίηση SOS Flare', 'Activate SOS Flare')}
        </h3>
        <p className="text-xs font-medium leading-relaxed text-gray-500 mb-6">
          {isSos
            ? t('Αυτό θα ενημερώσει την ομάδα ότι είστε ασφαλείς.', 'This will notify the group that you are safe.')
            : t(
                'Αυτό θα ειδοποιήσει αμέσως όλα τα μέλη της ομάδας ότι χρειάζεστε βοήθεια.',
                'This will immediately notify all group members that you need help.',
              )}
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98] ${
              isSos ? 'text-white bg-emerald-600 hover:bg-emerald-700' : 'text-white bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSos ? t('Απενεργοποίηση', 'Deactivate') : t('Ενεργοποίηση SOS', 'Activate SOS')}
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
