import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { DAILY_TIPS_GR, DAILY_TIPS_EN } from '../../lib/homeGreeting';

const DISMISS_KEY = 'nakamas.homeDailyTip.dismissedDay';

/** Tip of the Day — dismissible for the calendar day to keep Home quiet on return. */
export function HomeDailyTip() {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const tipIndex = Math.floor(Date.now() / 86400000) % DAILY_TIPS_GR.length;
  const dayKey = String(Math.floor(Date.now() / 86400000));
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === dayKey;
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const restore = () => {
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setDismissed(false);
  };

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, dayKey);
    } catch {
      /* ignore */
    }
    setDismissed(true);
    toast.message(t('Η συμβουλή ημέρας κρύφτηκε για σήμερα.', 'Tip of the day hidden for today.'), {
      action: {
        label: t('Αναίρεση', 'Undo'),
        onClick: restore,
      },
    });
  };

  return (
    <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 relative ${h.tipBanner}`}>
      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-3.5 h-3.5 text-amber-700" aria-hidden />
      </div>
      <div className="pr-8 min-w-0">
        <span className={`text-xs font-bold uppercase tracking-widest block mb-0.5 ${h.tipLabel}`}>
          {t('Συμβουλή Ημέρας', 'Tip of the Day')}
        </span>
        <p className={`text-sm font-medium leading-relaxed ${h.tipBody}`}>
          {t(DAILY_TIPS_GR[tipIndex], DAILY_TIPS_EN[tipIndex])}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('Απόκρυψη', 'Dismiss')}
        className={`absolute top-2 right-2 p-1.5 rounded-full shrink-0 ${
          tok.isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-white/80'
        }`}
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}
