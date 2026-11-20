import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { useNextNight } from '../../hooks/useNextNight';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { formatPlanWhen } from '../../lib/dateLocale';
import { EventCoverImg } from '../common/EventCoverImg';

export function HomeNextNightCard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const night = useNextNight();
  if (!night) return null;
  const { event, days, path } = night;
  const when =
    days <= 0 ? t('Απόψε', 'Tonight') : days === 1 ? t('Αύριο', 'Tomorrow') : t(`σε ${days} μέρες`, `in ${days} days`);

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      data-home-next-night
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl text-left shadow-soft',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <EventCoverImg event={event} className="absolute inset-0 h-full w-full object-cover" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10" />
      <span className="relative flex min-h-[8.5rem] flex-col justify-end gap-1 p-4 text-white">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {t('Η επόμενη βραδιά σου', 'Your next night')} · {when}
        </span>
        <span className="text-lg font-bold leading-tight line-clamp-2">{event.title}</span>
        <span className="flex items-center justify-between gap-2 text-xs text-white/85">
          <span className="truncate">{formatPlanWhen(event.date, event.time, language)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-3 py-1 font-semibold text-ink">
            {t('Η βραδιά μας', 'Our night')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </span>
    </button>
  );
}
