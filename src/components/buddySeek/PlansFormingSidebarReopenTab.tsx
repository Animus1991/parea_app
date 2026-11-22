import { Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

export function PlansFormingSidebarReopenTab() {
  const { t } = useLanguage();
  const setOpen = useStore((s) => s.setPlansFormingSidebarOpen);
  const sidebarOpen = useStore((s) => s.plansFormingSidebarOpen);
  const tok = useThemeStyles();

  if (sidebarOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1',
        'rounded-l-xl border border-r-0 py-3 px-1.5 shadow-soft-md min-w-[36px]',
        'transition-colors hover:bg-cyan-50',
        tok.isDark ? 'bg-[#0c1016]/95 border-white/10 text-cyan-300' : 'bg-white border-gray-200 text-cyan-700',
      )}
      aria-label={t('Βρες Nakamas — παρέα για εκδήλωση', 'Find Nakamas — company for an event')}
      title={t('Βρες Nakamas', 'Find Nakamas')}
    >
      <Users className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold [writing-mode:vertical-rl] rotate-180 tracking-wide">
        {t('Βρες Nakamas', 'Find Nakamas')}
      </span>
    </button>
  );
}
