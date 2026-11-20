import { CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { selectWeekPicks } from '../../lib/weekPicks';
import { formatPlanWhen } from '../../lib/dateLocale';
import { EventCoverImg } from '../common/EventCoverImg';
import { Button } from '../common/Button';

interface HomeOnboardingWelcomeBannerProps {
  onDismiss: () => void;
  useClassicTokens?: boolean;
}

export function HomeOnboardingWelcomeBanner({
  onDismiss,
  useClassicTokens = false,
}: HomeOnboardingWelcomeBannerProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const h = useHomeTheme();
  const p = usePageContrast();
  const currentUser = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const { events } = useEventsResource();
  const picks = currentUser ? selectWeekPicks(events, currentUser, groups).slice(0, 3) : [];

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-2xl border',
        useClassicTokens
          ? cn('bg-cyan-50/80 border-cyan-100 shadow-soft', h.card)
          : cn(p.cardSurface, p.borderB, 'shadow-soft'),
      )}
      role="status"
    >
      <div className="flex items-center gap-3 pr-8">
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center',
            useClassicTokens ? 'bg-cyan-100 text-cyan-700' : cn(p.isDark ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-50 text-cyan-600'),
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-bold', useClassicTokens ? h.heading : p.head)}>
            {t('Το προφίλ σου είναι έτοιμο!', 'Your profile is ready!')}
          </p>
          <p className={cn('mt-0.5 text-xs font-medium', p.sub)}>{t('3 βραδιές για σένα', '3 nights for you')}</p>
        </div>
      </div>
      {picks.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {picks.map((event) => (
            <article key={event.id} className={cn('overflow-hidden rounded-xl border', p.borderB)}>
              <EventCoverImg event={event} className="h-20 w-full object-cover" />
              <div className="space-y-2 p-2.5">
                <h3 className={cn('line-clamp-1 text-xs font-bold', p.head)}>{event.title}</h3>
                <p className={cn('text-2xs font-medium', p.muted)}>{formatPlanWhen(event.date, event.time, language)}</p>
                <Button size="sm" className="w-full" onClick={() => navigate(`/events/${event.id}`)}>{t('Δες τη βραδιά', 'See the night')}</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          'absolute top-3 right-3 p-2 rounded-full min-h-8 min-w-8 flex items-center justify-center transition-colors',
          useClassicTokens ? 'hover:bg-cyan-100 text-gray-500' : cn(p.muted, 'hover:opacity-80'),
        )}
        aria-label={t('Κλείσιμο', 'Close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
