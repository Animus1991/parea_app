import { Link } from 'react-router-dom';
import {
  Tag,
  Ticket,
  Users,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { getEventDetailContentTokens } from '../../lib/designTokens';
import { buildEventQuickInfo, inferLocationType } from '../../lib/eventQuickInfo';
import { isUserEventParticipant } from '../../lib/eventParticipation';
import { isFeedbackDue } from '../../lib/feedbackDue';
import { cn } from '../../lib/utils';
import { isDarkTheme } from '../../lib/themes';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventMap';

export interface EventDetailPageContentProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

function EventDetailQuickInfoBlock({
  event,
  accent,
  darkSurface,
  className,
}: {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const isParticipant = isUserEventParticipant(event.id, currentUser, groups);
  const meetingPoint = groups.find((g) => g.eventId === event.id && g.meetingPoint)?.meetingPoint;
  const info = buildEventQuickInfo(event, groups, t);
  const locationType = inferLocationType(event, isParticipant, meetingPoint);
  const locationLabel =
    locationType === 'public_venue'
      ? t(info.locationTypeEl, info.locationTypeEn)
      : locationType === 'online'
        ? t('Διαδικτυακά', 'Online')
        : locationType === 'private_semi'
          ? t('Ιδιωτικός / ημι-ιδιωτικός χώρος', 'Private / semi-private')
          : t('Αποκαλύπτεται μετά την επιβεβαίωση', 'Revealed after confirmation');

  const shell = darkSurface
    ? 'rounded-2xl border border-cyan-800/40 bg-cyan-950/30 shadow-soft p-4 md:p-5'
    : 'rounded-2xl border border-cyan-100 bg-cyan-50/80 shadow-soft p-4 md:p-5';

  const rows: { icon: typeof Tag; label: string; value: string }[] = [
    { icon: Tag, label: t('Κατηγορία', 'Category'), value: info.category },
    {
      icon: CheckCircle2,
      label: t('Ποιοι μπαίνουν', 'Who can join'),
      value: t(info.trustLevelEl, info.trustLevelEn),
    },
    {
      icon: MapPin,
      label: t('Χώρος', 'Venue'),
      value: t(info.comfortLevelEl, info.comfortLevelEn),
    },
    { icon: Ticket, label: t('Κόστος', 'Cost'), value: t(info.costEl, info.costEn) },
    {
      icon: Users,
      label: t('Ομάδες', 'Groups'),
      value: t(info.groupStatusEl, info.groupStatusEn),
    },
    { icon: MapPin, label: t('Τύπος τοποθεσίας', 'Location type'), value: locationLabel },
  ];

  return (
    <div className={cn(shell, className)} role="region" aria-label={t('Γρήγορες πληροφορίες', 'Quick info')}>
      <p className={cn('text-xs font-bold tracking-wide mb-3', content.metaLabel)}>
        {t('Γρήγορες πληροφορίες', 'Quick info')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5 min-w-0">
            <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
            <div className="min-w-0">
              <p className={cn('text-xs font-bold tracking-wide', content.metaLabel)}>{label}</p>
              <p className={cn('card-heading font-bold', content.metaValue)}>{value}</p>
            </div>
          </div>
        ))}
      </div>
      {isParticipant && meetingPoint && (
        <p className={cn('card-copy-sm font-medium mt-3 pt-3 border-t border-cyan-200/50', content.metaLabel)}>
          {t('Σημείο συνάντησης', 'Meeting point')}: {meetingPoint}
        </p>
      )}
    </div>
  );
}

function EventDetailNightFeedbackLink({
  event,
  accent,
  darkSurface,
  className,
}: {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const existing = useStore((s) => s.feedbackSubmitted[event.id]);
  const isParticipant = isUserEventParticipant(event.id, currentUser, groups);

  if (existing || !isParticipant || !isFeedbackDue(event)) return null;

  return (
    <div className={cn('pt-1', className)}>
      <Link
        to={`/history/feedback/${event.id}`}
        className={cn('text-sm font-semibold underline-offset-4 hover:underline', content.metaValue)}
      >
        {t('Πώς πέρασες;', 'How was it?')}
      </Link>
    </div>
  );
}

/** Quick Info + host organization rating (below event title). */
export default function EventDetailPageContent({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailPageContentProps) {
  // Themes without a dedicated event page (e.g. activebuddies-dark) render the
  // classic variant; their global text remaps are light, so these info panels
  // must use the dark surface too or the text becomes unreadable.
  const theme = useStore((s) => s.theme);
  const panelDark = darkSurface || isDarkTheme(theme);
  return (
    <div className={cn('space-y-4', className)}>
      <EventDetailNightFeedbackLink event={event} accent={accent} darkSurface={panelDark} />
      <EventDetailQuickInfoBlock event={event} accent={accent} darkSurface={panelDark} />
    </div>
  );
}
