import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { formatOutingDate } from '../../lib/outings';
import type { PlanCover } from '../../lib/planCovers';
import type { Event } from '../../types';

/**
 * The invitation card (Partiful, kept gentle): a soft gradient with text in
 * a colour that keeps 4.5:1 on both ends of it (see planCovers.test).
 */
export function InviteCover({
  cover,
  event,
  hostFirstName,
  goingCount,
  seatsLeft,
}: {
  cover: PlanCover;
  event: Pick<Event, 'title' | 'date' | 'time' | 'locationArea'>;
  hostFirstName?: string;
  goingCount: number;
  seatsLeft: number;
}) {
  const { t, language } = useLanguage();
  return (
    <div
      className="rounded-3xl p-5 shadow-soft"
      style={{ backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})`, color: cover.ink }}
      data-cover={cover.id}
    >
      <p className="text-xs font-bold">
        {hostFirstName ? t(`Ο/Η ${hostFirstName} σε καλεί`, `${hostFirstName} invites you`) : t('Πρόσκληση', 'Invitation')}
      </p>
      <h2 className="mt-1 text-lg font-black leading-tight">{event.title}</h2>
      <ul className="mt-3 space-y-1 text-sm font-semibold">
        <li className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          {formatOutingDate(event.date, language)} · {event.time}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {event.locationArea}
        </li>
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          {t(`${goingCount} πάνε · ${seatsLeft} θέσεις ακόμη`, `${goingCount} going · ${seatsLeft} seats left`)}
        </li>
      </ul>
    </div>
  );
}
