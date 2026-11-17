import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/i18n';
import { useStore } from '../../../store';
import { Modal } from '../../common/Modal';

interface GroupChatReportModalProps {
  open: boolean;
  onClose: () => void;
  groupId?: string;
}

export function GroupChatReportModal({ open, onClose, groupId }: GroupChatReportModalProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const submitIssueReport = useStore((s) => s.submitIssueReport);
  const [text, setText] = useState('');

  const submit = () => {
    const description = text.trim();
    if (!description) {
      toast.error(t('Γράψε τι συνέβη πριν την υποβολή.', 'Describe what happened before submitting.'));
      return;
    }
    submitIssueReport({
      category: 'safety',
      severity: 'high',
      description,
      evidenceNames: [],
      targetType: 'group',
      targetId: groupId,
    });
    setText('');
    toast.success(t('Η αναφορά σας υποβλήθηκε με ασφάλεια.', 'Your report has been submitted securely.'), {
      action: {
        label: t('Κέντρο Εμπιστοσύνης', 'Trust Center'),
        onClick: () => navigate('/trust'),
      },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setText('');
        onClose();
      }}
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-border rounded-2xl p-3 text-sm resize-none mb-5 focus:ring-2 focus:ring-accent/40 outline-none shadow-soft font-medium transition-all duration-200 bg-surface-raised text-ink"
        rows={4}
        placeholder={t(
          'Παρακαλώ περιγράψτε το πρόβλημα με λεπτομέρεια...',
          'Please describe the issue in detail...',
        )}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setText('');
            onClose();
          }}
          className="px-4 py-2 min-h-8 text-xs font-bold text-ink-muted bg-surface hover:bg-surface-raised rounded-full transition-all duration-200 border border-border"
        >
          {t('Ακύρωση', 'Cancel')}
        </button>
        <button
          type="button"
          onClick={submit}
          className="px-4 py-2 min-h-8 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-soft"
        >
          {t('Υποβολή Αναφοράς', 'Submit Report')}
        </button>
      </div>
    </Modal>
  );
}
