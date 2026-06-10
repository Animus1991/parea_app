import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { getEventParticipationRuleText } from '../../lib/eventParticipationRule';
import { getEventDetailContentTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

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
  const { t } = useLanguage();
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const ruleText = getEventParticipationRuleText(event.minTrustTierAccess, t);

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
        <p className={cn('font-medium text-sm', content.metaValue)}>
          {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
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
        <p className={cn('font-medium text-sm', content.metaValue)}>
          {event.time} ({event.duration})
        </p>
        <p className={cn('text-xs mt-0.5 font-medium', content.metaMuted)}>
          {event.timeZone || t('Τοπική Ώρα', 'Local Time')}
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
          <p className={cn('font-medium text-sm', content.metaValue)}>{event.locationArea}</p>
          <p className={cn('text-xs mt-0.5', content.metaMuted)}>
            {t(
              'Το ακριβές σημείο συνάντησης εμφανίζεται μετά την επιβεβαίωση.',
              'Exact meeting point revealed upon confirmation.',
            )}
          </p>
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
          {t('Κανόνες Συμμετοχής', 'Participation Rules')}
        </div>
        <div className="flex items-center gap-2">
          <p className={cn('font-medium text-sm capitalize', content.metaValue)}>{ruleText}</p>
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
