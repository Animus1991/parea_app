import { Sparkles, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

export function PlansFormingMobileFab() {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const feed = usePlansFormingFeed(8);
  const total = feed.insights.compatiblePlans + feed.insights.recruitingGroups;
  const hasPending = feed.insights.pendingJoinsToReview > 0;
  const showTeaser = !feed.hasContent && !feed.myActivePlan;

  if (!total && !hasPending && !showTeaser && !feed.myActivePlan) return null;

  const label = hasPending
    ? t('Αιτήματα', 'Requests')
    : feed.myActivePlan
      ? t('Το σχέδιό σας', 'Your plan')
      : showTeaser
        ? t('Ψάχνετε παρέα;', 'Need company?')
        : t('Σχέδια', 'Plans');

  const badge = hasPending
    ? feed.insights.pendingJoinsToReview
    : total > 0
      ? total
      : null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'xl:hidden fixed left-1/2 -translate-x-1/2 z-[55] flex items-center gap-2 min-h-11 pl-4 pr-3 rounded-full shadow-lg border font-bold text-sm transition-transform active:scale-[0.98] motion-reduce:transition-none',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
        hasPending
          ? 'bg-amber-500 border-amber-400 text-white animate-pulse motion-reduce:animate-none'
          : tok.isDark
            ? 'bg-cyan-600 border-cyan-500 text-white'
            : 'bg-cyan-600 border-cyan-700 text-white',
      )}
      aria-label={t('Άνοιγμα σχεδίων που σχηματίζονται', 'Open plans forming')}
    >
      {hasPending ? <Sparkles className="w-4 h-4" aria-hidden /> : <Users className="w-4 h-4" aria-hidden />}
      <span>{label}</span>
      {badge != null && (
        <span className="bg-white/25 text-white text-xs font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}
