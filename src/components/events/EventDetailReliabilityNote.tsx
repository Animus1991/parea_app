import { Users, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import {
  getEventDetailReliabilityShell,
  getEventDetailSurfaceTokens,
} from '../../lib/eventDetailDesignTokens';
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
              {t('Περιορισμός μικρής ομάδας.', 'Small group constraint.')}
            </strong>{' '}
            {t('Περιορίζεται σε ', 'Kept to ')}
            {event.maxParticipants || '3-6'}
            {t(
              ' άτομα για καλύτερο συντονισμό και άνεση.',
              ' people for better coordination and comfort.',
            )}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Επιβεβαιωμένη συμμετοχή.', 'Confirmed participation.')}
            </strong>{' '}
            {t(
              'Οι χρήστες πρέπει να δεσμευτούν για να συμμετάσχουν. Οι μη-εμφανίσεις παρακολουθούνται.',
              'Users must commit to join. No-shows are tracked internally.',
            )}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <MapPin className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Δημόσιο σημείο συνάντησης.', 'Public meeting point.')}
            </strong>{' '}
            {t(
              'Η ακριβής τοποθεσία συνάντησης αποκαλύπτεται μόνο αφού επιβεβαιωθεί η ομάδα.',
              'Exact meeting location is revealed only after the group is confirmed.',
            )}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className={cn('w-4 h-4 shrink-0 mt-0.5', tok.iconMuted)} />
          <span className={tok.listText}>
            <strong className={tok.listStrong}>
              {t('Ιδιωτικές αναφορές.', 'Private reports.')}
            </strong>{' '}
            {t(
              'Οποιαδήποτε ανάρμοστη συμπεριφορά μπορεί να αναφερθεί ιδιωτικά και επηρεάζει τις βαθμολογίες αξιοπιστίας.',
              'Any inappropriate behavior can be reported privately and affects reliability scores.',
            )}
          </span>
        </li>
      </ul>
    </section>
  );
}
