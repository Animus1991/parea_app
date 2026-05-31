import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { getEventParticipationRuleText } from '../../lib/eventParticipationRule';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

interface MetaTokens {
  label: string;
  value: string;
  muted: string;
  trustLink: string;
}

const TOKENS: Record<EventDetailMapAccent, { light: MetaTokens; dark: MetaTokens }> = {
  classic: {
    light: {
      label: 'text-gray-500',
      value: 'text-[#111827]',
      muted: 'text-gray-400',
      trustLink: 'text-cyan-600',
    },
    dark: {
      label: 'text-gray-300',
      value: 'text-white',
      muted: 'text-gray-400',
      trustLink: 'text-cyan-400',
    },
  },
  vibrant: {
    light: {
      label: 'text-gray-500',
      value: 'text-[#111827]',
      muted: 'text-gray-400',
      trustLink: 'text-fuchsia-600',
    },
    dark: {
      label: 'text-white',
      value: 'text-white',
      muted: 'text-white',
      trustLink: 'text-fuchsia-400',
    },
  },
  neon: {
    light: {
      label: 'text-gray-500',
      value: 'text-[#111827]',
      muted: 'text-gray-400',
      trustLink: 'text-emerald-600',
    },
    dark: {
      label: 'text-white',
      value: 'text-white',
      muted: 'text-white',
      trustLink: 'text-emerald-400',
    },
  },
  bento: {
    light: {
      label: 'text-black',
      value: 'text-[#111827]',
      muted: 'text-black',
      trustLink: 'text-indigo-600',
    },
    dark: {
      label: 'text-white',
      value: 'text-white',
      muted: 'text-white',
      trustLink: 'text-indigo-400',
    },
  },
};

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
  const tok = darkSurface ? TOKENS[accent].dark : TOKENS[accent].light;
  const ruleText = getEventParticipationRuleText(event.minTrustTierAccess, t);

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-1.5 font-bold tracking-wide text-[10px]',
            tok.label,
          )}
        >
          <Calendar className="h-3.5 w-3.5" /> {t('Ημερομηνία', 'Date')}
        </div>
        <p className={cn('font-medium text-[13px]', tok.value)}>
          {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-1.5 font-bold tracking-wide text-[10px]',
            tok.label,
          )}
        >
          <Clock className="h-3.5 w-3.5" /> {t('Ώρα', 'Time')}
        </div>
        <p className={cn('font-medium text-[13px]', tok.value)}>
          {event.time} ({event.duration})
        </p>
        <p className={cn('text-[11px] mt-0.5 font-medium', tok.muted)}>
          {event.timeZone || t('Τοπική Ώρα', 'Local Time')}
        </p>
      </div>
      <div className="space-y-3 col-span-2 sm:col-span-1">
        <div className="space-y-1">
          <div
            className={cn(
              'flex items-center gap-1.5 font-bold tracking-wide text-[10px]',
              tok.label,
            )}
          >
            <MapPin className="h-3.5 w-3.5" /> {t('Τοποθεσία', 'Location')}
          </div>
          <p className={cn('font-medium text-[13px]', tok.value)}>{event.locationArea}</p>
          <p className={cn('text-[11px] mt-0.5', tok.muted)}>
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
            'flex items-center gap-1.5 font-bold tracking-wide text-[10px]',
            tok.label,
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />{' '}
          {t('Κανόνες Συμμετοχής', 'Participation Rules')}
        </div>
        <div className="flex items-center gap-2">
          <p className={cn('font-medium text-[13px] capitalize', tok.value)}>{ruleText}</p>
          <Link
            to="/trust"
            className={cn('text-[11px] font-bold underline', tok.trustLink)}
          >
            {t('Γιατί;', 'Why?')}
          </Link>
        </div>
      </div>
    </div>
  );
}
