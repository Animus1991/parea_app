import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { selectWeekPicks } from '../../lib/weekPicks';
import { readStorage, writeStorage } from '../../lib/safeUrl';
import { formatPlanWhen } from '../../lib/dateLocale';
import { EventCoverImg } from '../common/EventCoverImg';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

const DISMISSED_KEY = 'nakamas-week-card-dismissed';

function isoWeekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

export function HomeWeekCard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const p = usePageContrast();
  const currentUser = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const { events } = useEventsResource();
  const { items } = usePlansFormingFeed(1);
  const now = new Date();
  const weekKey = isoWeekKey(now);
  const [dismissedKey, setDismissedKey] = useState(() => readStorage(DISMISSED_KEY));
  const dismissed = dismissedKey === weekKey;
  const picks = currentUser ? selectWeekPicks(events, currentUser, groups, now.getTime()) : [];
  const plan = items[0];
  if (dismissed || (picks.length === 0 && !plan)) return null;

  const dismiss = () => {
    writeStorage(DISMISSED_KEY, weekKey);
    setDismissedKey(weekKey);
  };

  return (
    <section className={cn('relative rounded-2xl border p-4 shadow-soft', p.cardSurface, p.borderB)} aria-labelledby="home-week-title">
      <button type="button" onClick={dismiss} aria-label={t('Κλείσιμο', 'Dismiss')} className={cn('absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full', p.muted, p.cardHover)}>
        <X className="h-4 w-4" aria-hidden />
      </button>
      <h2 id="home-week-title" className={cn('pr-9 text-sm font-bold', p.head)}>{t('Η εβδομάδα σου', 'Your week')}</h2>
      <ul className="mt-3 space-y-2">
        {picks.map((event) => (
          <li key={event.id}>
            <button type="button" onClick={() => navigate(`/events/${event.id}`)} className={cn('flex min-h-14 w-full items-center gap-3 rounded-xl border p-2 text-left', p.borderB, p.cardHover)}>
              <EventCoverImg event={event} className="h-10 w-12 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className={cn('block truncate text-xs font-bold', p.head)}>{event.title}</span>
                <span className={cn('block text-2xs font-medium', p.muted)}>{formatPlanWhen(event.date, event.time, language)}</span>
              </span>
            </button>
          </li>
        ))}
        {plan && (
          <li>
            <button type="button" onClick={() => navigate('/buddy-seek')} className={cn('flex min-h-14 w-full items-center gap-3 rounded-xl border p-2 text-left', p.borderB, p.cardHover)}>
              <EventCoverImg event={plan.event} className="h-10 w-12 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className={cn('block truncate text-xs font-bold', p.head)}>{plan.event.title}</span>
                <span className={cn('block text-2xs font-medium', p.muted)}>{t('Σχέδιο που σχηματίζεται · Βρες Nakamas', 'A forming plan · Find Nakamas')}</span>
              </span>
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
