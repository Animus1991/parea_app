import { useState } from 'react';
import { Gavel, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { activeStrikes, standingFor, strikeLabel, STRIKE_WINDOW_DAYS } from '../../lib/consequences';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

/**
 * Graduated consequences, explained (Timeleft, adapted): where you stand,
 * why, what happens next — and an appeal for each strike.
 */
export function StandingCard({ className }: { className?: string }) {
  const { t, language } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const strikes = useStore((s) => s.strikes);
  const events = useStore((s) => s.events);
  const appealStrike = useStore((s) => s.appealStrike);
  const [appealFor, setAppealFor] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  if (!me) return null;

  const standing = standingFor(strikes, me.id);
  const mine = strikes.filter((s) => s.userId === me.id).sort((a, b) => b.at.localeCompare(a.at));
  const active = new Set(activeStrikes(strikes, me.id).map((s) => s.id));
  const Icon = standing.level === 'good' ? ShieldCheck : ShieldAlert;

  return (
    <section className={cn('rounded-2xl border border-border bg-surface-raised p-4', className)} aria-labelledby="standing-title">
      <h2 id="standing-title" className="flex items-center gap-2 text-base font-bold text-ink">
        <Icon className="h-4 w-4" aria-hidden /> {t('Η κατάστασή σου', 'Your standing')}
      </h2>
      <p className="mt-1.5 text-sm font-bold text-ink" data-testid="standing-level">
        {t(standing.titleEl, standing.titleEn)}
      </p>
      <p className="mt-0.5 text-sm font-medium leading-relaxed text-ink-muted">{t(standing.explainEl, standing.explainEn)}</p>

      <details className="mt-2 text-xs font-medium text-ink">
        <summary className="min-h-8 cursor-pointer font-bold">{t('Πώς λειτουργεί', 'How it works')}</summary>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-muted leading-relaxed">
          <li>{t('1η απουσία ή αργή ακύρωση: προειδοποίηση.', '1st absence or late cancel: a warning.')}</li>
          <li>{t('2η: παύση 7 ημερών για ομάδες με αγνώστους (με φίλους μπορείς), μετά τελευταία προειδοποίηση.', '2nd: a 7-day pause for groups of strangers (with friends you still can), then a final warning.')}</li>
          <li>{t('3η: έλεγχος από την ομάδα ασφάλειας.', '3rd: a review by the safety team.')}</li>
          <li>{t(`Μετράνε μόνο τα τελευταία ${STRIKE_WINDOW_DAYS} ημέρες. Αν η θέση σου περάσει σε λίστα αναμονής, δεν μετράει.`, `Only the last ${STRIKE_WINDOW_DAYS} days count. If your seat passes to the waitlist, it does not count.`)}</li>
        </ol>
      </details>

      {mine.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {mine.map((s) => {
            const event = events.find((e) => e.id === s.eventId);
            return (
              <li key={s.id} className="py-2">
                <p className="text-sm font-bold text-ink">
                  {strikeLabel(s.kind, t)}
                  {event ? ` · ${event.title}` : ''}
                </p>
                <p className="text-2xs font-medium text-ink-muted">
                  {new Date(s.at).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB')} · {s.reliabilityDelta} {t('αξιοπιστία', 'reliability')}
                  {!active.has(s.id) ? t(' · δεν μετράει πια', ' · no longer counts') : ''}
                </p>
                {s.appeal ? (
                  <p className="mt-1 text-xs font-bold text-ink">
                    {s.appeal.status === 'pending'
                      ? t('Ένσταση σε εξέταση (απάντηση μέσα σε 48 ώρες)', 'Appeal under review (reply within 48 hours)')
                      : s.appeal.status === 'accepted'
                        ? t('Η ένσταση έγινε δεκτή — οι πόντοι επέστρεψαν', 'Appeal upheld — points restored')
                        : t('Η ένσταση δεν έγινε δεκτή', 'Appeal not upheld')}
                  </p>
                ) : appealFor === s.id ? (
                  <form
                    className="mt-2 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (appealStrike(s.id, text)) {
                        setSent(s.id);
                        setAppealFor(null);
                        setText('');
                        toast.success(t('Η ένστασή σου στάλθηκε.', 'Your appeal was sent.'));
                      }
                    }}
                  >
                    <label htmlFor={`appeal-${s.id}`} className="text-xs font-bold text-ink">
                      {t('Τι έγινε; (τουλάχιστον 10 χαρακτήρες)', 'What happened? (at least 10 characters)')}
                    </label>
                    <textarea
                      id={`appeal-${s.id}`}
                      value={text}
                      maxLength={600}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" type="submit" disabled={text.trim().length < 10}>
                        {t('Αποστολή ένστασης', 'Send appeal')}
                      </Button>
                      <Button size="sm" variant="ghost" type="button" onClick={() => setAppealFor(null)}>
                        {t('Άκυρο', 'Cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAppealFor(s.id)}
                    className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-ink underline underline-offset-2"
                  >
                    <Gavel className="h-3.5 w-3.5" aria-hidden /> {t('Ένσταση', 'Appeal')}
                  </button>
                )}
                {sent === s.id && (
                  <p role="status" className="mt-1 text-xs font-bold text-ink">
                    {t('Στάλθηκε. Ευχαριστούμε που μας εξήγησες.', 'Sent. Thanks for explaining.')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
