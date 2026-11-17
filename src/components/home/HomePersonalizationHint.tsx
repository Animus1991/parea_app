import { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { getDiscoveryPrefChips } from '../../lib/discoveryPrefsLabels';
import { cn } from '../../lib/utils';

const DISMISS_KEY = 'nakamas.homePersonalizationHint.dismissed';

interface HomePersonalizationHintProps {
  useClassicTokens?: boolean;
}

/** Shown when the logged-in user has profile interests — session-dismissible. */
export function HomePersonalizationHint({ useClassicTokens = false }: HomePersonalizationHintProps) {
  const { t } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  const h = useHomeTheme();
  const p = usePageContrast();
  const tok = useThemeStyles();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const hasInterests = (currentUser?.interests?.length ?? 0) > 0;
  const hasPrefs = getDiscoveryPrefChips(currentUser, t).length > 0;
  if (!hasInterests && !hasPrefs) return null;
  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs font-semibold relative pr-8',
        useClassicTokens ? h.labelMuted : p.sub,
      )}
    >
      <Heart
        className={cn(
          'w-3.5 h-3.5 shrink-0',
          useClassicTokens ? 'text-cyan-600' : p.iconAccent,
        )}
        aria-hidden
      />
      <span className="min-w-0">
        {hasInterests
          ? t(
              'Το «Για Σένα» βασίζεται στα ενδιαφέροντά σου από το προφίλ.',
              '«For You» is tailored to your profile interests.',
            )
          : t(
              'Το «Για Σένα» βασίζεται στις προτιμήσεις ανακάλυψης από το onboarding.',
              '«For You» uses your onboarding discovery preferences.',
            )}
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('Απόκρυψη', 'Dismiss')}
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full',
          tok.isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-black/5',
        )}
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </p>
  );
}
