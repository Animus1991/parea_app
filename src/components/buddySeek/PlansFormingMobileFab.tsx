import { Inbox, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

/** Plans shortcut for tablets (md to xl). Phones use the combined dock in layout/MobileDock. */
export function PlansFormingMobileFab() {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { visible, label, badge, hasPending } = usePlansFabState();

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'hidden md:flex xl:hidden fixed left-1/2 -translate-x-1/2 z-fab items-center gap-2 min-h-8 pl-4 pr-3 rounded-full shadow-soft-lg border font-bold text-xs transition-transform active:scale-[0.98] motion-reduce:transition-none',
        'bottom-fab-zone',
        hasPending
          ? 'bg-amber-500 border-amber-400 text-white animate-pulse motion-reduce:animate-none'
          : tok.isDark
            ? 'bg-cyan-600 border-cyan-500 text-white'
            : 'bg-cyan-600 border-cyan-700 text-white',
      )}
      aria-label={t('Βρες Nakamas — σχέδια που σχηματίζονται', 'Find Nakamas — plans forming')}
    >
      {hasPending ? <Inbox className="w-4 h-4" aria-hidden /> : <Users className="w-4 h-4" aria-hidden />}
      <span>{label}</span>
      {badge != null && (
        <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}
