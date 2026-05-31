import { Sparkles } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { getDiscoveryPrefChips } from '../../lib/discoveryPrefsLabels';
import { cn } from '../../lib/utils';

interface HomePersonalizationHintProps {
  useClassicTokens?: boolean;
}

/** Shown when the logged-in user has profile interests (onboarding or settings). */
export function HomePersonalizationHint({ useClassicTokens = false }: HomePersonalizationHintProps) {
  const { t } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  const h = useHomeTheme();
  const p = usePageContrast();

  const hasInterests = (currentUser?.interests?.length ?? 0) > 0;
  const hasPrefs = getDiscoveryPrefChips(currentUser, t).length > 0;
  if (!hasInterests && !hasPrefs) return null;

  return (
    <p
      className={cn(
        'flex items-center gap-2 text-[11px] font-semibold',
        useClassicTokens ? h.labelMuted : p.sub,
      )}
    >
      <Sparkles
        className={cn(
          'w-3.5 h-3.5 shrink-0',
          useClassicTokens ? 'text-cyan-600' : p.iconAccent,
        )}
      />
      {hasInterests
        ? t(
            'Το «Για Σένα» βασίζεται στα ενδιαφέροντά σου από το προφίλ.',
            '«For You» is tailored to your profile interests.',
          )
        : t(
            'Το «Για Σένα» βασίζεται στις προτιμήσεις ανακάλυψης από το onboarding.',
            '«For You» uses your onboarding discovery preferences.',
          )}
    </p>
  );
}
