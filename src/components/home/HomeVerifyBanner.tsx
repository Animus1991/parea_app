import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useStore } from '../../store';

const DISMISS_KEY = 'nakamas.homeVerifyBanner.dismissed';
const DISMISS_EVENT = 'nakamas:home-verify-dismissed';

export function homeVerifyIsNeeded(
  user: { emailVerified?: boolean; phoneVerified?: boolean } | null | undefined,
  dismissed: boolean,
): boolean {
  if (!user) return false;
  if (user.emailVerified && user.phoneVerified) return false;
  return !dismissed;
}

export function useHomeVerifyNeeded(): boolean {
  const currentUser = useStore((s) => s.currentUser);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const sync = () => {
      try {
        setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
      } catch {
        setDismissed(false);
      }
    };
    sync();
    window.addEventListener(DISMISS_EVENT, sync);
    return () => window.removeEventListener(DISMISS_EVENT, sync);
  }, []);

  return homeVerifyIsNeeded(currentUser, dismissed);
}

function dismissHomeVerify() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

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
  const needed = useHomeVerifyNeeded();

  if (!needed || !currentUser) return null;

  const needsEmail = !currentUser.emailVerified;
  const needsPhone = !currentUser.phoneVerified;
  const title = needsEmail && needsPhone
    ? t('Επαληθεύστε email και τηλέφωνο', 'Verify email and phone')
    : needsEmail
      ? t('Επαληθεύστε το email σας', 'Verify your email')
      : t('Επαληθεύστε το τηλέφωνό σας', 'Verify your phone');

  const dismiss = () => dismissHomeVerify();

  return (
    <section
      className={`rounded-2xl px-3.5 py-2.5 flex flex-row items-center justify-between gap-3 border relative ${tok.isDark ? 'border-white/10' : 'border-gray-200 bg-white/60'}`}
    >
      <div className="flex gap-2.5 items-center min-w-0">
        <div
          className="text-cyan-600 shrink-0"
        >
          <ShieldCheck className="w-4 h-4" aria-hidden />
        </div>
        <div>
          <h3 className={`text-sm font-bold ${h.feedbackTitle}`}>{title}</h3>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
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
