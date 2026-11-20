import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { el, enUS } from 'date-fns/locale';
import { Button } from '../common/Button';
import { CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { PAGE_FILL } from '../layout/PageShell';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import type { FeedbackData } from '../../store';
import { FEEDBACK_MOODS, starsForMood } from '../../lib/feedbackDue';

const COMMENT_MAX = 280;

export default function PostEventFeedbackPageContent() {
  const { t, tu, language } = useLanguage();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const p = usePageContrast();
  const c = useContrastTheme();
  const events = useStore((s) => s.events);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const alreadySubmitted = useStore((s) =>
    eventId ? Boolean(s.feedbackSubmitted[eventId]) : false,
  );

  const event = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) : undefined),
    [events, eventId],
  );

  const [done, setDone] = useState(alreadySubmitted);
  const [mood, setMood] = useState('');
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | undefined>(undefined);
  const [comment, setComment] = useState('');

  const dateLocale = language === 'el' ? el : enUS;
  const eventDateLabel = event?.date
    ? format(parseISO(event.date), 'PPP', { locale: dateLocale })
    : null;

  const handleSubmit = () => {
    if (!eventId || !event || !mood) return;
    const overallRating = starsForMood(mood);
    const payload: FeedbackData = {
      eventId,
      overallRating,
      vibeRating: overallRating,
      mood,
      comment: comment.slice(0, COMMENT_MAX),
      submittedAt: new Date().toISOString(),
      wouldGoAgain,
    };
    submitFeedback(payload);
    setDone(true);
  };

  if (!eventId || !event) {
    return (
      <div className={cn(PAGE_FILL, 'py-4 text-center space-y-4')}>
        <p className={cn('text-sm font-medium', p.sub)}>
          {t('Η εκδήλωση δεν βρέθηκε.', 'Event not found.')}
        </p>
        <Button variant={p.isAB ? 'primary' : 'outline'} onClick={() => navigate('/history')}>
          {t('Επιστροφή στο Ιστορικό', 'Back to History')}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 md:space-y-5 pb-24 md:pb-6 animate-in slide-in-from-bottom-4 duration-500 fade-in')}>
      <div>
        <h1 className={cn(APP_TYPO.pageTitle, p.head)}>{t('Πώς πέρασες;', 'How was it?')}</h1>
        <p className={cn('text-sm font-medium mt-1', p.sub)}>
          {t('Μια μικρή νότα — αν θες, και αν θα ξαναπήγαινες.', 'One note — and, if you like, whether you’d go again.')}
        </p>
      </div>

      <div
        className={cn(
          'rounded-2xl p-4 md:p-4 shadow-soft flex items-start gap-4 border',
          p.cardSurface,
          p.borderB,
        )}
      >
        {event.imageUrl && (
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10 hidden sm:block">
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={cn('text-sm md:text-base font-bold truncate', p.head)}>{event.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            {eventDateLabel && (
              <span className={cn('text-xs font-bold flex items-center gap-1', p.muted)}>
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {eventDateLabel}
              </span>
            )}
            {event.locationArea && (
              <span className={cn('text-xs font-bold flex items-center gap-1', p.muted)}>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {event.locationArea}
              </span>
            )}
          </div>
        </div>
      </div>

      {done ? (
        <div
          className={cn(
            'rounded-2xl shadow-soft border p-5 md:p-4 text-center flex flex-col items-center justify-center',
            p.cardSurface,
            p.borderB,
          )}
        >
          <CheckCircle2
            className={cn('w-10 h-10 mb-3', p.isDark ? 'text-emerald-400' : 'text-emerald-600')}
          />
          <h2 className={cn('text-sm md:text-base font-bold tracking-tight mb-2', p.head)}>
            {t('Ευχαριστούμε.', 'Thank you.')}
          </h2>
          <p className={cn('text-sm font-medium max-w-sm mx-auto mb-5 leading-relaxed', p.sub)}>
            {t('Αυτό ήταν όλο.', 'That’s all.')}
          </p>
          <Button
            onClick={() => navigate('/history')}
            variant={p.isAB ? 'primary' : 'outline'}
            size="md"
            className="rounded-full"
          >
            {t('Επιστροφή στο Ιστορικό', 'Back to History')}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'rounded-2xl p-4 md:p-5 shadow-soft border space-y-5',
            p.cardSurface,
            p.borderB,
          )}
        >
          <div>
            <h3 className={cn('text-xs font-bold tracking-wide pl-1 mb-4', p.head)}>
              {tu('Πώς νιώθεις;', 'How did it feel?')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FEEDBACK_MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  aria-pressed={mood === m.id}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs transition-all duration-300 min-h-16',
                    mood === m.id
                      ? p.isDark
                        ? 'border-cyan-500 bg-cyan-900/20 shadow-soft scale-[1.02]'
                        : 'border-cyan-500 bg-cyan-50 shadow-soft scale-[1.02]'
                      : cn(
                          'hover:border-cyan-300',
                          p.isDark ? 'border-gray-800 bg-black/20' : 'border-gray-100 bg-white',
                        ),
                  )}
                >
                  <span className="text-lg drop-shadow-soft">{m.emoji}</span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      mood === m.id ? (p.isDark ? 'text-cyan-400' : 'text-cyan-700') : p.muted,
                    )}
                  >
                    {t(m.el, m.en)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className={cn('text-xs font-bold tracking-wide pl-1 mb-3', p.head)}>
              {tu('Θα ξαναπήγαινες;', 'Would you go again?')}
            </h3>
            <p className={cn('text-xs font-medium pl-1 mb-3', p.sub)}>
              {t('Προαιρετικό.', 'Optional.')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: true, el: 'Ναι', en: 'Yes' },
                  { value: false, el: 'Μάλλον όχι', en: 'Probably not' },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  aria-pressed={wouldGoAgain === opt.value}
                  onClick={() =>
                    setWouldGoAgain((prev) => (prev === opt.value ? undefined : opt.value))
                  }
                  className={cn(
                    'min-h-10 px-4 rounded-full border text-xs font-bold transition-colors',
                    wouldGoAgain === opt.value
                      ? p.isDark
                        ? 'border-cyan-500 bg-cyan-900/20 text-cyan-300'
                        : 'border-cyan-500 bg-cyan-50 text-cyan-800'
                      : cn(p.borderB, p.head, p.cardSurface),
                  )}
                >
                  {t(opt.el, opt.en)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className={cn('text-xs font-bold tracking-wide pl-1 mb-3', p.head)}>
              {tu('Κάτι ακόμα;', 'Anything else?')}
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder={t('Προαιρετικό σημείωμα', 'Optional note')}
              className={cn(
                'w-full px-4 py-3 border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none shadow-soft',
                c.inputBg,
                c.inputFg,
                c.placeholder,
                p.borderB,
              )}
              rows={3}
            />
            <p className={cn('text-xs font-medium mt-2 flex items-center justify-between', p.muted)}>
              <span>{t('Μόνο για την ομάδα Nakamas — όχι δημόσιο.', 'Only for Nakamas — not public.')}</span>
              <span>
                {comment.length}/{COMMENT_MAX}
              </span>
            </p>
          </div>

          <div className="pt-1">
            <Button
              className="w-full"
              variant={p.isAB ? 'primary' : 'gradient'}
              onClick={handleSubmit}
              disabled={!mood}
            >
              {t('Αποστολή', 'Send')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
