import { useState } from 'react';
import {
  Tag,
  ShieldCheck,
  Ticket,
  Users,
  MapPin,
  Star,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import type { FeedbackData } from '../../store';
import { getEventDetailContentTokens } from '../../lib/eventDetailDesignTokens';
import {
  getEventCalendarAvailability,
  openGoogleCalendar,
  downloadICS,
} from '../../lib/eventCalendarExport';
import { buildEventQuickInfo, inferLocationType } from '../../lib/eventQuickInfo';
import { isEventCompleted, isUserEventParticipant } from '../../lib/eventParticipation';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventMap';
import { Button } from '../common/Button';

export interface EventDetailPageContentProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailCalendarActions({
  event,
  accent,
  darkSurface = false,
  compact = false,
  className,
}: {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const users = useStore((s) => s.users);
  const groups = useStore((s) => s.groups);
  const availability = getEventCalendarAvailability(event);
  const host = users.find((u) => u.id === event.organizerId);
  const meetingPoint = groups.find((g) => g.eventId === event.id && g.meetingPoint)?.meetingPoint;
  const { content } = getEventDetailContentTokens(accent, darkSurface);

  const btn = cn(
    'inline-flex items-center gap-2 font-bold tracking-wide transition-colors rounded-2xl shadow-soft min-h-11',
    compact ? 'text-[10px] px-3 py-1.5' : 'text-[11px] px-4 py-2',
    darkSurface
      ? 'bg-gray-800/80 text-white hover:bg-gray-700 border border-gray-600'
      : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200',
  );

  const handleGoogle = () => {
    if (!availability.ok) return;
    const ok = openGoogleCalendar(event, {
      hostName: host?.name,
      meetingPoint,
    });
    if (!ok) toast.error(t(availability.reasonEl, availability.reasonEn));
  };

  const handleIcs = () => {
    if (!availability.ok) return;
    const ok = downloadICS(event, { hostName: host?.name, meetingPoint });
    if (!ok) toast.error(t(availability.reasonEl, availability.reasonEn));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-2', compact && 'justify-end')}>
        <button
          type="button"
          className={cn(btn, !availability.ok && 'opacity-50 cursor-not-allowed')}
          disabled={!availability.ok}
          onClick={handleGoogle}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {t('Προσθήκη στο Google Calendar', 'Add to Google Calendar')}
        </button>
        <button
          type="button"
          className={cn(btn, !availability.ok && 'opacity-50 cursor-not-allowed')}
          disabled={!availability.ok}
          onClick={handleIcs}
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          {t('Λήψη .ics', 'Download ICS')}
        </button>
      </div>
      {!availability.ok && (
        <p className={cn('text-[11px] font-medium', content.metaLabel)}>
          {t(availability.reasonEl, availability.reasonEn)}
        </p>
      )}
    </div>
  );
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
      icon: ShieldCheck,
      label: t('Επίπεδο εμπιστοσύνης', 'Trust level'),
      value: t(info.trustLevelEl, info.trustLevelEn),
    },
    {
      icon: ShieldCheck,
      label: t('Επίπεδο άνεσης', 'Comfort level'),
      value: t(info.comfortLevelEl, info.comfortLevelEn),
    },
    {
      icon: ShieldCheck,
      label: t('Επαλήθευση', 'Verification'),
      value: t(info.verificationEl, info.verificationEn),
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
      <p className={cn('text-[11px] font-bold tracking-wide uppercase mb-3', content.metaLabel)}>
        {t('Γρήγορες πληροφορίες', 'Quick info')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5 min-w-0">
            <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
            <div className="min-w-0">
              <p className={cn('text-[10px] font-bold tracking-wide', content.metaLabel)}>{label}</p>
              <p className={cn('text-[13px] font-bold', content.metaValue)}>{value}</p>
            </div>
          </div>
        ))}
      </div>
      {isParticipant && meetingPoint && (
        <p className={cn('text-[12px] font-medium mt-3 pt-3 border-t border-cyan-200/50', content.metaLabel)}>
          {t('Σημείο συνάντησης', 'Meeting point')}: {meetingPoint}
        </p>
      )}
    </div>
  );
}

function EventDetailHostOrganizationRating({
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
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const submitFeedback = useStore((s) => s.submitFeedback);

  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const existing = feedbackSubmitted[event.id];
  const completed = isEventCompleted(event);
  const isParticipant = isUserEventParticipant(event.id, currentUser, groups);

  // Attendance: group membership = attended (mock store). TODO: wire ticket.used when backend exists.
  const canRate = completed && isParticipant;

  if (!canRate) return null;

  const shell = darkSurface
    ? 'rounded-2xl border border-amber-900/40 bg-amber-950/20 shadow-soft p-4 md:p-5'
    : 'rounded-2xl border border-amber-100 bg-amber-50/90 shadow-soft p-4 md:p-5';

  const handleSubmit = () => {
    if (rating < 1) {
      toast.error(t('Επιλέξτε αστέρια πριν την υποβολή', 'Select stars before submitting'));
      return;
    }
    const payload: FeedbackData = {
      eventId: event.id,
      overallRating: rating,
      vibeRating: rating,
      mood: 'good',
      comment: t(
        'Αξιολόγηση οργάνωσης διοργανωτή (σελίδα εκδήλωσης)',
        'Host organization feedback (event page)',
      ),
      submittedAt: new Date().toISOString(),
      attendance: 'yes',
    };
    submitFeedback(payload);
    setSubmitted(true);
    toast.success(t('Ευχαριστούμε — η αξιολόγησή σας καταχωρήθηκε.', 'Thanks — your feedback was saved.'));
  };

  if (existing || submitted) {
    const stars = existing?.overallRating ?? rating;
    return (
      <div className={cn(shell, className)}>
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className={cn('text-[13px] font-bold', content.metaValue)}>
            {t('Η αξιολόγηση οργάνωσης καταχωρήθηκε', 'Organization feedback submitted')}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-2" aria-label={t('Βαθμολογία', 'Rating')}>
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(shell, className)}>
      <p className={cn('text-[11px] font-bold tracking-wide uppercase mb-1', content.metaLabel)}>
        {t('Αξιολογήστε την οργάνωση του διοργανωτή', "Rate the host's organization")}
      </p>
      <p className={cn('text-[13px] font-medium mb-4', content.metaValue)}>
        {t('Πόσο καλά συντονίστηκε αυτή η εκδήλωση;', 'How well was this event coordinated?')}
      </p>
      <div
        className="flex items-center gap-1 mb-4"
        onMouseLeave={() => setHover(0)}
        role="group"
        aria-label={t('Βαθμολογία 1–5', 'Rating 1–5')}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="p-1 min-h-11 min-w-11 flex items-center justify-center rounded-2xl transition-transform hover:scale-110"
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            aria-label={`${n}`}
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                (hover || rating) >= n ? 'text-amber-500 fill-amber-500' : 'text-gray-300',
              )}
            />
          </button>
        ))}
      </div>
      <Button
        type="button"
        className="rounded-2xl shadow-soft min-h-11"
        onClick={handleSubmit}
        disabled={rating < 1}
      >
        {t('Υποβολή αξιολόγησης', 'Submit feedback')}
      </Button>
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
  return (
    <div className={cn('space-y-4', className)}>
      <EventDetailQuickInfoBlock event={event} accent={accent} darkSurface={darkSurface} />
      <EventDetailHostOrganizationRating
        event={event}
        accent={accent}
        darkSurface={darkSurface}
      />
    </div>
  );
}
