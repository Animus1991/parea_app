import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { getDiscoveryPrefChips } from '../../lib/discoveryPrefsLabels';
import { cn } from '../../lib/utils';

interface HomeDiscoveryPrefsChipsProps {
  useClassicTokens?: boolean;
}

/** Shows onboarding discovery preferences as read-only context chips (not URL filters). */
export function HomeDiscoveryPrefsChips({ useClassicTokens = false }: HomeDiscoveryPrefsChipsProps) {
  const { t } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  const h = useHomeTheme();
  const p = usePageContrast();

  const chips = getDiscoveryPrefChips(currentUser, t);
  if (chips.length === 0) return null;

  const chipClass = useClassicTokens
    ? cn(
        'whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold border',
        h.tagInactive,
      )
    : cn(
        'whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold border',
        p.borderB,
        p.sub,
      );

  return (
    <div className="flex flex-wrap gap-2 -mt-1">
      {chips.map((chip) => (
        <span key={chip.id} className={chipClass} title={chip.label}>
          {chip.label}
        </span>
      ))}
    </div>
  );
}
