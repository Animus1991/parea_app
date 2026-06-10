import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { computeProfileCompletion } from '../../lib/behavioralOptimizer';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export function ProfileCompletionMeter({ className }: { className?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const user = useStore((s) => s.currentUser);

  if (!user) return null;

  const { percent, nextActionEl, nextActionEn, nextPath } = computeProfileCompletion(user, Boolean(user.bio?.trim()));

  return (
    <div className={cn('rounded-2xl border p-4', a.cardSurface, a.borderB, className)}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className={cn('text-sm font-bold', a.head)}>
          {t('Πληρότητα προφίλ', 'Profile completion')}
        </p>
        <span className={cn('text-sm font-bold tabular-nums', a.iconAccent)}>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent < 100 && (
        <button
          type="button"
          onClick={() => navigate(nextPath)}
          className={cn(
            'flex items-center gap-2 text-xs font-semibold w-full text-left hover:opacity-80 transition-opacity',
            a.iconAccent,
          )}
        >
          {t(nextActionEl, nextActionEn)}
          <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
        </button>
      )}
    </div>
  );
}
