import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { resumeLabel } from '../../lib/resumePath';
import { trackEvent } from '../../lib/analytics';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

/**
 * One-job strip: bring the user back to where they left off.
 * Shown only when a meaningful last path exists; dismissible without removing other CTAs.
 */
export function HomeContinueStrip() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const path = useStore((s) => s.lastResumePath);
  const clear = useStore((s) => s.clearLastResumePath);

  if (!path) return null;

  const label = resumeLabel(path, language === 'el' ? 'el' : 'en');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3.5 py-2.5',
        a.cardSurface,
        a.borderB,
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
        className="flex flex-1 items-center gap-3 min-w-0 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="flex-1 min-w-0">
          <span className={cn('block text-2xs font-bold uppercase tracking-wider', a.muted)}>
            {t('Συνέχεια', 'Continue')}
          </span>
          <span className={cn('block text-sm font-bold truncate', a.head)}>{label}</span>
        </span>
        <ArrowRight className={cn('w-4 h-4 shrink-0', a.iconAccent)} aria-hidden />
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
        <X className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
