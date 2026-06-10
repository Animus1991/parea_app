import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { el, enUS } from 'date-fns/locale';
import { Button } from '../common/Button';
import {
  Star,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Trophy,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import type { FeedbackData } from '../../store';

const COMMENT_MAX = 500;

export default function PostEventFeedbackPageContent() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const p = usePageContrast();
  const c = useContrastTheme();
  const events = useStore((s) => s.events);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const awardXp = useStore((s) => s.awardXp);
  const alreadySubmitted = useStore((s) =>
    eventId ? Boolean(s.feedbackSubmitted[eventId]) : false,
  );

  const event = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) : undefined),
    [events, eventId],
  );

  const [step, setStep] = useState(alreadySubmitted ? 2 : 1);
  const [overallRating, setOverallRating] = useState(0);
  const [vibeRating, setVibeRating] = useState(0);
  const [mood, setMood] = useState('');
  const [attendance, setAttendance] = useState('');
  const [comfort, setComfort] = useState('');
  const [comment, setComment] = useState('');

  const moods = [
    { emoji: '🤩', label: t('Φανταστικά', 'Amazing') },
    { emoji: '😊', label: t('Ωραία', 'Good') },
    { emoji: '😐', label: t('Μέτρια', 'Okay') },
    { emoji: '😕', label: t('Δεν μου άρεσε', 'Meh') },
  ];

  const dateLocale = language === 'el' ? el : enUS;
  const eventDateLabel = event?.date
    ? format(parseISO(event.date), 'PPP', { locale: dateLocale })
    : null;

  const handleSubmit = () => {
    if (!eventId || !event) return;
    const attendanceStore =
      attendance === 'all' ? 'yes' : attendance === 'no_show' ? 'no_show' : undefined;
    const payload: FeedbackData = {
      eventId,
      overallRating,
      vibeRating,
      mood,
      comment: comment.slice(0, COMMENT_MAX),
      submittedAt: new Date().toISOString(),
      attendance: attendanceStore,
      safetyComfort: comfort || undefined,
    };
    submitFeedback(payload);
    awardXp(25, 'Υποβολή αξιολόγησης', 'Feedback submitted');
    setStep(2);
  };

  if (!eventId || !event) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
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
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className={cn('text-2xl md:text-3xl font-extrabold tracking-tight', p.head)}>
          {t('Αξιολόγηση Εκδήλωσης', 'Post-Event Feedback')}
        </h1>
        <p className={cn('text-sm md:text-base font-medium mt-1', p.sub)}>
          {t(
            'Πείτε μας πώς ήταν η εμπειρία σας στην πρόσφατη εκδήλωση.',
            'Tell us about your experience at the recent event.',
          )}
        </p>
      </div>

      <div
        className={cn(
          'rounded-2xl p-4 md:p-6 shadow-soft flex items-start gap-4 border',
          p.cardSurface,
          p.borderB,
        )}
      >
        {event.imageUrl && (
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 hidden sm:block">
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={cn('text-lg font-bold truncate', p.head)}>{event.title}</h3>
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

      {step === 1 && (
        <div
          className={cn(
            'flex flex-col sm:flex-row items-center sm:justify-center text-center sm:text-left gap-3 md:gap-4 rounded-2xl p-4 md:p-5 shadow-soft border',
            p.isDark
              ? 'bg-amber-900/10 border-amber-800/50'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              p.isDark
                ? 'bg-amber-900/30 text-amber-400'
                : 'bg-white text-amber-600 border border-amber-100 shadow-soft',
            )}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-extrabold flex items-center gap-1 justify-center sm:justify-start',
                p.isDark ? 'text-amber-400' : 'text-amber-900',
              )}
            >
              {t('Κερδίστε +25 XP', 'Earn +25 XP')} <Sparkles className="w-3.5 h-3.5" />
            </p>
            <p
              className={cn(
                'text-[11px] font-bold mt-0.5',
                p.isDark ? 'text-amber-500/80' : 'text-amber-700',
              )}
            >
              {t(
                'Η αξιολόγηση ανεβάζει το level σας και βοηθά την κοινότητα',
                'Rating boosts your level and helps the community',
              )}
            </p>
          </div>
        </div>
      )}

      {step === 1 ? (
        <div
          className={cn(
            'rounded-2xl p-6 md:p-8 shadow-soft border space-y-8',
            p.cardSurface,
            p.borderB,
          )}
        >
          <div>
            <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-4', p.head)}>
              {t('Πώς νιώσατε;', 'How did you feel?')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {moods.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-300',
                    mood === m.emoji
                      ? p.isDark
                        ? 'border-cyan-500 bg-cyan-900/20 shadow-soft scale-[1.02]'
                        : 'border-cyan-500 bg-cyan-50 shadow-soft scale-[1.02]'
                      : cn(
                          'hover:border-cyan-300',
                          p.isDark ? 'border-gray-800 bg-black/20' : 'border-gray-100 bg-white',
                        ),
                  )}
                >
                  <span className="text-4xl drop-shadow-sm">{m.emoji}</span>
                  <span
                    className={cn(
                      'text-[11px] font-bold',
                      mood === m.emoji ? (p.isDark ? 'text-cyan-400' : 'text-cyan-700') : p.muted,
                    )}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className={cn('border-t', p.borderB)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-2', p.head)}>
                {t('Γενική Εντύπωση', 'Overall Experience')}
              </h3>
              <p className={cn('text-xs font-medium pl-1 mb-3', p.sub)}>
                {t('Πώς θα βαθμολογούσατε την εκδήλωση;', 'How would you rate the event?')}
              </p>
              <div className="flex gap-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 w-fit">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`overall-${star}`}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        star <= overallRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-gray-300 dark:text-gray-700 hover:text-amber-300',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-2', p.head)}>
                {t('Ατμόσφαιρα', 'Vibe')}
              </h3>
              <p className={cn('text-xs font-medium pl-1 mb-3', p.sub)}>
                {t('Πώς ήταν η ατμόσφαιρα της ομάδας;', 'How was the group atmosphere?')}
              </p>
              <div className="flex gap-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 w-fit">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`vibe-${star}`}
                    type="button"
                    onClick={() => setVibeRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        star <= vibeRating
                          ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                          : 'text-gray-300 dark:text-gray-700 hover:text-cyan-300',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className={cn('border-t', p.borderB)} />

          <div className="space-y-6">
            <div>
              <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-3', p.head)}>
                {t('Παρουσία', 'Attendance')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttendance('all')}
                  className={cn(
                    'p-4 border rounded-2xl text-left flex items-center gap-3 transition-colors',
                    attendance === 'all'
                      ? p.isDark
                        ? 'border-cyan-500 bg-cyan-900/20 shadow-soft'
                        : 'border-cyan-500 bg-cyan-50 shadow-soft'
                      : p.cardSurface,
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      attendance === 'all' ? 'border-cyan-500' : 'border-gray-300',
                    )}
                  >
                    {attendance === 'all' && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      attendance === 'all' ? p.iconAccent : p.head,
                    )}
                  >
                    {t('Ναι, ήρθαν όλοι', 'Yes, everyone showed up')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('no_show')}
                  className={cn(
                    'p-4 border rounded-2xl text-left flex items-center gap-3 transition-colors',
                    attendance === 'no_show'
                      ? p.isDark
                        ? 'border-amber-500 bg-amber-900/20 shadow-soft'
                        : 'border-amber-500 bg-amber-50 shadow-soft'
                      : p.cardSurface,
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      attendance === 'no_show' ? 'border-amber-500' : 'border-gray-300',
                    )}
                  >
                    {attendance === 'no_show' && (
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      attendance === 'no_show'
                        ? p.isDark
                          ? 'text-amber-400'
                          : 'text-amber-700'
                        : p.head,
                    )}
                  >
                    {t('Όχι, κάποιοι δεν ήρθαν', "No, some didn't show up")}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-3', p.head)}>
                {t('Αίσθημα Ασφάλειας', 'Safety Comfort')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setComfort('safe')}
                  className={cn(
                    'p-4 border rounded-2xl text-left flex items-center gap-3 transition-colors',
                    comfort === 'safe'
                      ? p.isDark
                        ? 'border-emerald-500 bg-emerald-900/20 shadow-soft'
                        : 'border-emerald-500 bg-emerald-50 shadow-soft'
                      : p.cardSurface,
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      comfort === 'safe' ? 'border-emerald-500' : 'border-gray-300',
                    )}
                  >
                    {comfort === 'safe' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      comfort === 'safe'
                        ? p.isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : p.head,
                    )}
                  >
                    {t('Ένιωσα πλήρως ασφαλής', 'Felt completely safe')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setComfort('unsafe')}
                  className={cn(
                    'p-4 border rounded-2xl text-left flex items-center justify-between gap-3 transition-colors',
                    comfort === 'unsafe'
                      ? p.isDark
                        ? 'border-red-500 bg-red-900/20 shadow-soft'
                        : 'border-red-500 bg-red-50 shadow-soft'
                      : p.cardSurface,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        comfort === 'unsafe' ? 'border-red-500' : 'border-gray-300',
                      )}
                    >
                      {comfort === 'unsafe' && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        comfort === 'unsafe'
                          ? p.isDark
                            ? 'text-red-400'
                            : 'text-red-700'
                          : p.head,
                      )}
                    >
                      {t('Είχα κάποια ανησυχία', 'I had some concerns')}
                    </span>
                  </div>
                  {comfort === 'unsafe' && (
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <hr className={cn('border-t', p.borderB)} />

          <div>
            <h3 className={cn('text-[13px] font-bold uppercase tracking-widest pl-1 mb-3', p.head)}>
              {t('Σχόλιο (Προαιρετικό)', 'Comment (Optional)')}
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder={t(
                'Μοιραστείτε περισσότερα για την εμπειρία σας...',
                'Share more about your experience...',
              )}
              className={cn(
                'w-full px-4 py-3 border rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none shadow-soft',
                c.inputBg,
                c.inputFg,
                c.placeholder,
                p.borderB,
              )}
              rows={4}
            />
            <p className={cn('text-[11px] font-medium mt-2 flex items-center justify-between', p.muted)}>
              <span>{t('Ορατό στον διοργανωτή', 'Visible to organizer')}</span>
              <span>
                {comment.length}/{COMMENT_MAX}
              </span>
            </p>
          </div>

          <div className="pt-2">
            <Button
              className="w-full h-14 text-base font-bold rounded-2xl shadow-soft"
              variant={p.isAB ? 'primary' : 'gradient'}
              onClick={handleSubmit}
              disabled={overallRating === 0}
            >
              {t('Υποβολή Αξιολόγησης', 'Submit Feedback')}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'rounded-2xl shadow-soft border p-8 md:p-12 text-center flex flex-col items-center justify-center',
            p.cardSurface,
            p.borderB,
          )}
        >
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-6 border shadow-soft relative overflow-hidden',
              p.isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100',
            )}
          >
            <div className="absolute inset-0 bg-emerald-500/20 animate-ping" />
            <CheckCircle2
              className={cn('w-10 h-10 relative z-10', p.isDark ? 'text-emerald-400' : 'text-emerald-600')}
            />
          </div>

          <h2 className={cn('text-3xl font-extrabold tracking-tight mb-3', p.head)}>
            {t('Ευχαριστούμε!', 'Thank You!')}
          </h2>
          <p className={cn('text-[15px] font-medium max-w-sm mx-auto mb-8 leading-relaxed', p.sub)}>
            {t(
              'Η αξιολόγησή σας βοηθά σημαντικά στη βελτίωση της εμπειρίας για όλη την κοινότητα.',
              'Your feedback significantly helps improve the experience for the entire community.',
            )}
          </p>

          <div
            className={cn(
              'flex items-center gap-3 md:gap-4 rounded-2xl p-4 md:p-5 shadow-soft border mb-8 text-left w-full max-w-sm',
              p.isDark
                ? 'bg-amber-900/10 border-amber-800/50'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                p.isDark
                  ? 'bg-amber-900/30 text-amber-400'
                  : 'bg-white text-amber-600 border border-amber-100 shadow-soft',
              )}
            >
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className={cn('text-xl font-black', p.isDark ? 'text-amber-400' : 'text-amber-900')}>
                +25 XP
              </p>
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-widest mt-0.5',
                  p.isDark ? 'text-amber-500/80' : 'text-amber-700',
                )}
              >
                {t('Προστέθηκαν στο προφίλ!', 'Added to profile!')}
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/history')}
            variant={p.isAB ? 'primary' : 'outline'}
            size="lg"
            className="rounded-2xl px-8 font-bold text-sm"
          >
            {t('Επιστροφή στο Ιστορικό', 'Back to History')}
          </Button>
        </div>
      )}
    </div>
  );
}
