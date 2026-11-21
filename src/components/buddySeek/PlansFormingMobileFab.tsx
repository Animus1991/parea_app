import { useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePlansFabState } from '../../hooks/usePlansFabState';
import { useStore } from '../../store';
import { hidesFindCompanyShortcut } from '../../lib/plansFormingRail';
import { cn } from '../../lib/utils';

const FIND_COMPANY_ARIA = {
  el: 'Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου',
  en: 'Find company now — small outings next to you',
} as const;

function useFindCompanyShortcut() {
  const { t } = useLanguage();
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { visible, label } = usePlansFabState();
  const { pathname } = useLocation();
  return {
    show: visible && !hidesFindCompanyShortcut(pathname),
    label,
    ariaLabel: t(FIND_COMPANY_ARIA.el, FIND_COMPANY_ARIA.en),
    open: () => setOpen(true),
  };
}

/** Web header: static, immediately left of search. Phones/tablets keep the floated pills. */
export function PlansFormingHeaderButton() {
  const { show, label, ariaLabel, open } = useFindCompanyShortcut();
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={open}
      data-find-company-cta="header"
      className="hidden lg:inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border border-accent-strong bg-accent text-accent-fg font-bold text-xs whitespace-nowrap transition-transform active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={ariaLabel}
    >
      <Users className="w-3.5 h-3.5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

/** Nearby-now shortcut for tablets (md–lg). Phones use the dock; web uses the header. */
export function PlansFormingMobileFab() {
  const { show, label, ariaLabel, open } = useFindCompanyShortcut();
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={open}
      data-find-company-cta="float"
      className={cn(
        'hidden md:flex lg:hidden fixed left-1/2 -translate-x-1/2 z-fab items-center gap-2 min-h-8 pl-4 pr-3 rounded-full shadow-round-lg border border-accent-strong bg-accent text-accent-fg font-bold text-xs transition-transform active:scale-[0.98] motion-reduce:transition-none',
        'bottom-fab-zone',
      )}
      aria-label={ariaLabel}
    >
      <Users className="w-4 h-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
