import { useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { useStore } from '../../store';
import { hidesFindCompanyShortcut } from '../../lib/plansFormingRail';
import { cn } from '../../lib/utils';

/** Nearby-now shortcut for tablets (md to xl). Phones use the combined dock in layout/MobileDock. */
export function PlansFormingMobileFab() {
  const { t } = useLanguage();
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { visible, label } = usePlansFabState();
  const { pathname } = useLocation();

  if (!visible || hidesFindCompanyShortcut(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'hidden md:flex xl:hidden fixed left-1/2 -translate-x-1/2 z-fab items-center gap-2 min-h-8 pl-4 pr-3 rounded-full shadow-round-lg border border-accent-strong bg-accent text-accent-fg font-bold text-xs transition-transform active:scale-[0.98] motion-reduce:transition-none',
        'bottom-fab-zone',
      )}
      aria-label={t('Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου', 'Find company now — small outings next to you')}
    >
      <Users className="w-4 h-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
