import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { resumeLabel } from '../../lib/resumePath';
import { trackEvent } from '../../lib/analytics';
import { prefetchPath } from '../../lib/routeLoaders';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useReturnSummary } from '../../hooks/useReturnSummary';
import { returnPartPath } from '../../lib/returnVisit';

/**
 * One-job strip: bring the user back to where they left off.
 * Hidden when HomeReturnLine already links to the same destination (no duplicate loyalty chrome).
 */
export function HomeContinueStrip() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const path = useStore((s) => s.lastResumePath);
  const clear = useStore((s) => s.clearLastResumePath);
  const returnParts = useReturnSummary();

  if (!path || path === '/') return null;

  // Welcome-back line already covers this destination — keep one clear CTA in the hero.
  if (returnParts.some((part) => returnPartPath(part) === path)) return null;

  const label = resumeLabel(path, language === 'el' ? 'el' : 'en');

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2',
        a.isDark ? 'bg-white/[0.04]' : 'bg-gray-50/80',
      )}
      role="region"
      aria-label={t('Συνέχεια από εκεί που σταμάτησες', 'Continue where you left off')}
    >
      <button
        type="button"
        onClick={() => {
          trackEvent({ name: 'resume_strip_continue', path });
          navigate(path);
        }}
        onMouseEnter={() => prefetchPath(path)}
        onFocus={() => prefetchPath(path)}
        className="flex flex-1 items-center gap-2.5 min-w-0 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="flex-1 min-w-0">
          <span className={cn('block text-2xs font-semibold', a.muted)}>
            {t('Συνέχεια', 'Continue')}
          </span>
          <span className={cn('block text-sm font-semibold truncate', a.head)}>{label}</span>
        </span>
        <ArrowRight className={cn('w-3.5 h-3.5 shrink-0 opacity-70', a.iconAccent)} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => {
          trackEvent({ name: 'resume_strip_dismiss', path });
          clear();
        }}
        className={cn(
          'shrink-0 p-2 rounded-lg min-h-10 min-w-10 flex items-center justify-center transition-colors',
          a.muted,
          'hover:bg-black/5 dark:hover:bg-white/10',
        )}
        aria-label={t('Απόκρυψη', 'Dismiss')}
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}
