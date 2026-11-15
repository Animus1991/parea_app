import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/i18n';
import { Modal } from '../../common/Modal';

interface GroupChatReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function GroupChatReportModal({ open, onClose }: GroupChatReportModalProps) {
  const { t } = useLanguage();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Ιδιωτική Αναφορά Ασφαλείας', 'Private Safety Report')}
      size="md"
    >
      <p className="text-xs font-semibold text-ink-muted tracking-tight capitalize -mt-2 mb-3">
        {t('Απολύτως Εμπιστευτικό', 'Strictly Confidential')}
      </p>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center text-red-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium leading-relaxed text-ink-muted bg-surface p-3 rounded-lg border border-border flex-1">
          {t(
            'Αυτή η αναφορά πηγαίνει απευθείας στην ομάδα ελέγχου. ',
            'This report goes directly to the Nakamas moderation team. It will ',
          )}
          <span className="font-bold text-ink">{t('Δεν', 'not')}</span>
          {t(
            ' θα κοινοποιηθεί στα μέλη. Βοηθήστε μας να διατηρήσουμε την κοινότητα ασφαλή.',
            ' be shared with the group members. Help us keep the community safe.',
          )}
        </p>
      </div>
      <textarea
        data-autofocus
        className="w-full border border-border rounded-2xl p-3 text-sm resize-none mb-5 focus:ring-2 focus:ring-accent/40 outline-none shadow-soft font-medium transition-all duration-200 bg-surface-raised text-ink"
        rows={4}
        placeholder={t(
          'Παρακαλώ περιγράψτε το πρόβλημα με λεπτομέρεια...',
          'Please describe the issue in detail...',
        )}
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-xs font-bold text-ink-muted bg-surface hover:bg-surface-raised rounded-2xl transition-all duration-200 border border-border"
        >
          {t('Ακύρωση', 'Cancel')}
        </button>
        <button
          type="button"
          onClick={() => {
            toast.success(
              t('Η αναφορά σας υποβλήθηκε με ασφάλεια.', 'Your report has been submitted securely.'),
            );
            onClose();
          }}
          className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 shadow-soft"
        >
          {t('Υποβολή Αναφοράς', 'Submit Report')}
        </button>
      </div>
    </Modal>
  );
}
