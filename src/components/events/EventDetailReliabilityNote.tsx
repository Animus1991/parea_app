import { Users, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import {
  getEventDetailReliabilityShell,
  getEventDetailSurfaceTokens,
} from '../../lib/designTokens';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

export interface EventDetailReliabilityNoteProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailReliabilityNote({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailReliabilityNoteProps) {
  const { t } = useLanguage();
  const tok = getEventDetailSurfaceTokens(accent, darkSurface);
  const shell = getEventDetailReliabilityShell(darkSurface);

  return (
    <section className={cn(shell, className)}>
      <h3 className={cn(tok.sectionHeading, 'mb-3')}>
        {t('Γιατί αυτή η ομάδα είναι αξιόπιστη', 'Why this group is reliable')}
      </h3>
      <ul className="space-y-2.5">
        <li className="flex items-start gap-2">
          <Users className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Μικρή ομάδα', 'Small group')}
            </strong>
            {event.maxParticipants ? ` · ${event.maxParticipants}` : ''}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Επιβεβαιωμένη συμμετοχή', 'Confirmed attendance')}
            </strong>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <MapPin className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Δημόσιο σημείο συνάντησης', 'Public meeting point')}
            </strong>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Ιδιωτικές αναφορές', 'Private reports')}
            </strong>
          </span>
        </li>
      </ul>
    </section>
  );
}
