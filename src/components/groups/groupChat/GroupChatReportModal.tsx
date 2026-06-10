import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/i18n';

interface GroupChatReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function GroupChatReportModal({ open, onClose }: GroupChatReportModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="modal-panel max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827]">
              {t('Ιδιωτική Αναφορά Ασφαλείας', 'Private Safety Report')}
            </h3>
            <p className="text-xs font-semibold text-gray-600 tracking-tight capitalize mt-0.5">
              {t('Απολύτως Εμπιστευτικό', 'Strictly Confidential')}
            </p>
          </div>
        </div>
        <p className="text-xs font-medium leading-relaxed text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          {t(
            'Αυτή η αναφορά πηγαίνει απευθείας στην ομάδα ελέγχου. ',
            'This report goes directly to the Nakamas moderation team. It will ',
          )}
          <span className="font-bold text-gray-800">{t('Δεν', 'not')}</span>
          {t(
            ' θα κοινοποιηθεί στα μέλη. Βοηθήστε μας να διατηρήσουμε την κοινότητα ασφαλή.',
            ' be shared with the group members. Help us keep the community safe.',
          )}
        </p>
        <textarea
          className="w-full border border-gray-100 rounded-2xl p-3 text-sm resize-none mb-5 focus:ring-2 focus:ring-[#18D8DB]/40 outline-none shadow-soft font-medium transition-all duration-200"
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
            className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-100"
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
            className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 shadow-soft"
          >
            {t('Υποβολή Αναφοράς', 'Submit Report')}
          </button>
        </div>
      </div>
    </div>
  );
}
