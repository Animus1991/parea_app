import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useHomePendingFeedback } from '../../hooks/useHomePendingFeedback';

export function HomePendingFeedbackBanner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const h = useHomeTheme();
  const pendingFeedbackEvent = useHomePendingFeedback();

  if (!pendingFeedbackEvent) return null;

  return (
    <section
      className={`rounded-2xl px-3 py-2 flex items-center gap-2 shadow-soft ${h.feedbackBanner}`}
    >
      <CheckCircle2 className={`w-4 h-4 shrink-0 ${h.feedbackTitle}`} aria-hidden />
      <p className={`min-w-0 flex-1 text-xs font-medium leading-snug line-clamp-2 ${h.feedbackBody}`}>
        <span className={`font-bold ${h.feedbackTitle}`}>
          {t('Εκκρεμής αξιολόγηση', 'Pending review')}
        </span>
        {' · '}
        {t(
          `Αξιολογήστε το «${pendingFeedbackEvent.title}» για να ξεκλειδώσετε την επόμενη κράτηση.`,
          `Rate “${pendingFeedbackEvent.title}” to unlock your next booking.`,
        )}
      </p>
      <button
        type="button"
        onClick={() => navigate(`/history/feedback/${pendingFeedbackEvent.id}`)}
        className={`text-xs font-bold px-3 min-h-8 rounded-full whitespace-nowrap shrink-0 ${h.feedbackBtn}`}
      >
        {t('Αξιολόγηση', 'Rate')}
      </button>
    </section>
  );
}
