import { useMemo, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import type { FeedbackData } from '../../store';
import { getEventDetailContentTokens } from '../../lib/eventDetailDesignTokens';
import { isEventPast, isUserEventParticipant } from '../../lib/eventParticipation';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';
import { Button } from '../common/Button';

export interface EventDetailHostRatingSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailHostRatingSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailHostRatingSectionProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const users = useStore((s) => s.users);

  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const organizer = useMemo(
    () => users.find((u) => u.id === event.organizerId),
    [users, event.organizerId],
  );

  const existing = feedbackSubmitted[event.id];
  const isParticipant = isUserEventParticipant(event.id, currentUser, groups);
  const isPast = isEventPast(event);
  const visible = isPast && isParticipant;

  if (!visible) return null;

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
      comment: t('Αξιολόγηση διοργανωτή από σελίδα εκδήλωσης', 'Host rating from event page'),
      submittedAt: new Date().toISOString(),
      attendance: 'yes',
    };
    submitFeedback(payload);
    setSubmitted(true);
    toast.success(t('Ευχαριστούμε για την αξιολόγησή σας!', 'Thanks for your rating!'));
  };

  if (existing || submitted) {
    const stars = existing?.overallRating ?? rating;
    return (
      <div className={cn(shell, className)}>
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className={cn('text-sm font-bold', content.metaValue)}>
            {t('Έχετε αξιολογήσει αυτή την εκδήλωση', 'You rated this event')}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
          ))}
        </div>
        <button
          type="button"
          className={cn('mt-3 text-sm font-bold underline', content.metaLabel)}
          onClick={() => navigate(`/history/feedback/${event.id}`)}
        >
          {t('Πλήρης φόρμα αξιολόγησης', 'Full feedback form')}
        </button>
      </div>
    );
  }

  return (
    <div className={cn(shell, className)}>
      <p className={cn('text-xs font-bold tracking-wide uppercase mb-1', content.metaLabel)}>
        {t('Η εκδήλωση ολοκληρώθηκε', 'Event completed')}
      </p>
      <p className={cn('text-sm font-bold mb-1', content.metaValue)}>
        {t('Πώς ήταν η εμπειρία σας;', 'How was your experience?')}
      </p>
      {organizer && (
        <p className={cn('text-sm font-medium mb-3', content.metaLabel)}>
          {t('Αξιολογήστε τον διοργανωτή', 'Rate the host')}: {organizer.name}
        </p>
      )}
      <div
        className="flex items-center gap-1 mb-4"
        onMouseLeave={() => setHover(0)}
        role="group"
        aria-label={t('Βαθμολογία αστέρων', 'Star rating')}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="p-1 min-h-11 min-w-11 flex items-center justify-center rounded-2xl transition-transform hover:scale-110"
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            aria-label={`${n} ${t('αστέρια', 'stars')}`}
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
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-2xl shadow-soft min-h-11"
          onClick={handleSubmit}
          disabled={rating < 1}
        >
          {t('Υποβολή αξιολόγησης', 'Submit rating')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl min-h-11"
          onClick={() => navigate(`/history/feedback/${event.id}`)}
        >
          {t('Λεπτομερής αξιολόγηση', 'Detailed feedback')}
        </Button>
      </div>
    </div>
  );
}
