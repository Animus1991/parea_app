import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useHomePendingFeedback } from '../../hooks/useHomePendingFeedback';

export function HomePendingFeedbackBanner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const pendingFeedbackEvent = useHomePendingFeedback();

  if (!pendingFeedbackEvent) return null;

  return (
    <section
      className={`rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft ${h.feedbackBanner}`}
    >
      <div className="flex gap-3 items-center">
        <div
          className={`p-2 text-amber-600 rounded-full shadow-soft shrink-0 ${tok.isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className={`text-[14.63px] font-bold ${h.feedbackTitle}`}>
            {t('Εκκρεμής Αξιολόγηση', 'Pending Feedback')}
          </h3>
          <p className={`text-[11.33px] font-medium mt-0.5 leading-relaxed ${h.feedbackBody}`}>
            {t(
              `Αξιολογήστε τα μέλη από το "${pendingFeedbackEvent.title}" για να ξεκλειδώσετε την επόμενη κράτησή σας.`,
              `Rate the members from "${pendingFeedbackEvent.title}" to unlock your next booking.`,
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(`/history/feedback/${pendingFeedbackEvent.id}`)}
        className={`text-[12.38px] tracking-wider font-bold px-4 py-2 rounded-full whitespace-nowrap w-full sm:w-auto shadow-soft transition-all duration-200 ${h.feedbackBtn}`}
      >
        {t('Αξιολόγηση', 'Rate Now')}
      </button>
    </section>
  );
}
