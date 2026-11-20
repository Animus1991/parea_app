import { Siren } from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { Modal } from '../../common/Modal';
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
  const isSos = Boolean(group.membersLocations?.[currentUserId]?.sos);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSos ? t('Είμαι εντάξει', "I'm okay") : t('Χρειάζομαι βοήθεια', 'I need help')}
      size="sm"
    >
      <div className="text-center">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
          <Siren className="w-5 h-5 animate-pulse motion-reduce:animate-none" />
        </div>
        <p className="text-xs font-medium leading-relaxed text-ink-muted mb-4">
          {isSos
            ? t('Αυτό θα ενημερώσει την ομάδα ότι είσαι ασφαλής.', 'This will notify the group that you are safe.')
            : t(
                'Αυτό θα ειδοποιήσει αμέσως όλα τα μέλη της ομάδας ότι χρειάζεσαι βοήθεια.',
                'This will immediately notify all group members that you need help.',
              )}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            className={`w-full px-4 py-2 min-h-9 text-xs font-bold rounded-full transition-all duration-200 shadow-soft active:scale-[0.98] ${
              isSos ? 'text-white bg-emerald-600 hover:bg-emerald-700' : 'text-white bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSos ? t('Είμαι εντάξει', "I'm okay") : t('Ειδοποίηση ομάδας', 'Notify the group')}
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
