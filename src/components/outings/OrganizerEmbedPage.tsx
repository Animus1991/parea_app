import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Users } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { formatOutingDate, formingGroups } from '../../lib/outings';
import { organizerCalendarUrl } from '../../lib/organizerCalendar';

/**
 * Embeddable organizer calendar (Luma, adapted): a small read-only list for
 * an organizer's own website, with «παρέα σχηματίζεται» on each event and a
 * live calendar subscription. Every link opens Nakamas in a new tab, so the
 * frame never acts on the visitor's behalf.
 */
export default function OrganizerEmbedPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { t, language } = useLanguage();
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const organizer = useStore((s) => s.users.find((u) => u.id === id));
  const name = id === 'platform' ? 'Nakamas' : organizer?.name ?? id;
  const limit = Math.min(20, Math.max(1, Number(params.get('limit')) || 6));
  const today = new Date().toISOString().slice(0, 10);

  const list = useMemo(
    () =>
      events
        .filter((e) => e.organizerId === id && e.status !== 'cancelled' && e.status !== 'archived' && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, limit),
    [events, id, today, limit],
  );
  const origin = window.location.origin;
  const feed = organizerCalendarUrl(origin, id);

  return (
    <main id="main-content" className="min-h-screen bg-surface p-3 text-ink">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-sm font-black text-ink">{t(`Επόμενα · ${name}`, `Upcoming · ${name}`)}</h1>
          <a href={feed.webcal} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-ink">
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden /> {t('Ακολούθησε', 'Subscribe')}
          </a>
        </div>
        {list.length === 0 ? (
          <p className="mt-3 text-xs font-medium text-ink-muted">{t('Δεν υπάρχουν προσεχείς εκδηλώσεις.', 'No upcoming events.')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface-raised">
            {list.map((e) => {
              const forming = formingGroups(e, groups).length;
              return (
                <li key={e.id}>
                  <a href={`${origin}/events/${e.id}`} target="_blank" rel="noopener noreferrer" className="block px-3 py-2.5 hover:bg-surface">
                    <span className="block text-2xs font-bold text-ink-muted">
                      {formatOutingDate(e.date, language)} · {e.time} · {e.locationArea.split(',')[0]}
                    </span>
                    <span className="block text-sm font-bold text-ink">{e.title}</span>
                    {forming > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-2xs font-bold text-ink">
                        <Users className="h-3 w-3" aria-hidden />
                        {t(`Παρέα σχηματίζεται · ${forming} ${forming === 1 ? 'ομάδα' : 'ομάδες'}`, `Group forming · ${forming} ${forming === 1 ? 'group' : 'groups'}`)}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-2xs font-medium text-ink-muted">
          <a href={origin} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Nakamas
          </a>{' '}
          — {t('βρες παρέα για να πας μαζί.', 'find company to go together.')}
        </p>
      </div>
    </main>
  );
}
