import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { getEventParticipationRuleText } from '../../lib/eventParticipationRule';
import { getEventDetailContentTokens } from '../../lib/designTokens';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';
import { dateFnsLocale } from '../../lib/dateLocale';
import { useStore } from '../../store';
import { isUserEventParticipant } from '../../lib/eventParticipation';
import { formatLocationArea } from '../../lib/eventDisplay';

export interface EventDetailMetaSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailMetaSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailMetaSectionProps) {
  const { t, language } = useLanguage();
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const ruleText = getEventParticipationRuleText(event.minTrustTierAccess, t);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  // One place says where to meet: here. Members see the point; others see when it appears.
  const meetingPoint = isUserEventParticipant(event.id, currentUser, groups)
    ? groups.find((g) => g.eventId === event.id && currentUser && g.members.includes(currentUser.id) && g.meetingPoint)?.meetingPoint
    : undefined;

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-1.5 font-bold tracking-wide text-xs',
            content.metaLabel,
          )}
        >
          <Calendar className="h-3.5 w-3.5" /> {t('Ημερομηνία', 'Date')}
        </div>
        <p className={cn('card-copy font-medium', content.metaValue)}>
          {format(parseISO(event.date), 'EEEE, PPP', { locale: dateFnsLocale(language) })}
        </p>
      </div>
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-1.5 font-bold tracking-wide text-xs',
            content.metaLabel,
          )}
        >
          <Clock className="h-3.5 w-3.5" /> {t('Ώρα', 'Time')}
        </div>
        <p className={cn('card-copy font-medium', content.metaValue)}>
          {event.time} ({event.duration})
        </p>
        <p className={cn('text-xs mt-0.5 font-medium', content.metaMuted)}>
          {event.timeZone || t('Τοπική ώρα', 'Local Time')}
        </p>
      </div>
      <div className="space-y-3 col-span-2 sm:col-span-1">
        <div className="space-y-1">
          <div
            className={cn(
              'flex items-center gap-1.5 font-bold tracking-wide text-xs',
              content.metaLabel,
            )}
          >
            <MapPin className="h-3.5 w-3.5" /> {t('Τοποθεσία', 'Location')}
          </div>
          <p className={cn('card-copy font-medium', content.metaValue)}>{formatLocationArea(event.locationArea, language)}</p>
          {meetingPoint ? (
            <p className={cn('text-xs mt-0.5 font-semibold', content.metaValue)}>
              {t('Σημείο συνάντησης', 'Meeting point')}: {meetingPoint}
            </p>
          ) : (
            <p className={cn('text-xs mt-0.5', content.metaMuted)}>
              {t(
                'Το ακριβές σημείο συνάντησης εμφανίζεται μετά την επιβεβαίωση.',
                'Exact meeting point revealed upon confirmation.',
              )}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1 col-span-2 sm:col-span-1">
        <div
          className={cn(
            'flex items-center gap-1.5 font-bold tracking-wide text-xs',
            content.metaLabel,
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />{' '}
          {t('Κανόνες συμμετοχής', 'Participation Rules')}
        </div>
        <div className="flex items-center gap-2">
          <p className={cn('card-copy font-medium capitalize', content.metaValue)}>{ruleText}</p>
          <Link
            to="/trust"
            className={cn('text-xs font-bold underline', content.trustLink)}
          >
            {t('Γιατί;', 'Why?')}
          </Link>
        </div>
      </div>
    </div>
  );
}
