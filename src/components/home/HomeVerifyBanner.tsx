import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useStore } from '../../store';

const DISMISS_KEY = 'nakamas.homeVerifyBanner.dismissed';

/**
 * Soft home nudge when email or phone is unverified — does not block Explore.
 * Session-dismissible so it stays light on return visits within the same tab.
 */
export function HomeVerifyBanner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const currentUser = useStore((s) => s.currentUser);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!currentUser) return null;
  if (currentUser.emailVerified && currentUser.phoneVerified) return null;
  if (dismissed) return null;

  const needsEmail = !currentUser.emailVerified;
  const needsPhone = !currentUser.phoneVerified;
  const title = needsEmail && needsPhone
    ? t('Επαληθεύστε email και τηλέφωνο', 'Verify email and phone')
    : needsEmail
      ? t('Επαληθεύστε το email σας', 'Verify your email')
      : t('Επαληθεύστε το τηλέφωνό σας', 'Verify your phone');
  const body = t(
    'Η επαλήθευση ανεβάζει το Trust Score και ξεκλειδώνει περισσότερες συνδέσεις.',
    'Verification raises your Trust Score and unlocks more connections.',
  );

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <section
      className={`rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft relative ${h.feedbackBanner}`}
    >
      <div className="flex gap-3 items-center pr-8 sm:pr-0">
        <div
          className={`p-2 text-cyan-600 rounded-full shadow-soft shrink-0 ${tok.isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <ShieldCheck className="w-4 h-4" aria-hidden />
        </div>
        <div>
          <h3 className={`text-sm font-bold ${h.feedbackTitle}`}>{title}</h3>
          <p className={`text-xs font-medium mt-0.5 leading-relaxed ${h.feedbackBody}`}>{body}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={() => navigate('/verification')}
          className={`text-xs tracking-wide font-bold px-3.5 py-1.5 min-h-8 rounded-full whitespace-nowrap shadow-soft transition-all duration-200 ${h.feedbackBtn}`}
        >
          {t('Επαλήθευση', 'Verify')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('Απόκρυψη', 'Dismiss')}
          className={`p-2 rounded-full shrink-0 ${tok.isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-white/80'}`}
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
