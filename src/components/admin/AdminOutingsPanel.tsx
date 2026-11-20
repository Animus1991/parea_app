import { useMemo } from 'react';
import { DoorOpen, Gavel, ShieldAlert, UserCheck, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { outingMetrics } from '../../lib/outings';
import { standingFor, strikeLabel } from '../../lib/consequences';
import { intlLocale } from '../../lib/dateLocale';
import { Button } from '../common/Button';

/**
 * Admin › outings (Φ27). Metrics count real people only — the lesson of IRL,
 * which reported 20M users and had ~95% bots: outings that happened are
 * groups with 2+ door check-ins; «active» means verified email + phone and
 * in a live group. The appeals queue and the review list sit next to them.
 */
export function AdminOutingsPanel({ section }: { section: 'metrics' | 'appeals' }) {
  const { t, language } = useLanguage();
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const strikes = useStore((s) => s.strikes);
  const events = useStore((s) => s.events);
  const decideAppeal = useStore((s) => s.decideAppeal);
  const m = useMemo(() => outingMetrics(groups, users, strikes), [groups, users, strikes]);

  if (section === 'metrics') {
    const tiles = [
      { icon: DoorOpen, label: t('Έξοδοι που έγιναν', 'Outings that happened'), value: String(m.outingsHappened), hint: t('2+ check-in στην πόρτα', '2+ door check-ins') },
      { icon: Percent, label: t('Προσέλευση', 'Show rate'), value: m.showRate === null ? '—' : `${m.showRate}%`, hint: t('όσοι ήρθαν / όσοι δήλωσαν', 'arrived / signed up') },
      { icon: UserCheck, label: t('Επαληθευμένα ενεργά μέλη', 'Verified active members'), value: String(m.verifiedActive), hint: t('email + τηλέφωνο, σε ομάδα', 'email + phone, in a group') },
      { icon: Gavel, label: t('Ενστάσεις σε αναμονή', 'Pending appeals'), value: String(m.pendingAppeals), hint: t('απάντηση σε 48 ώρες', 'reply within 48 h') },
    ];
    return (
      <section aria-labelledby="admin-outings-title" className="space-y-2">
        <h2 id="admin-outings-title" className="text-xs font-bold tracking-wide text-ink">
          {t('Πραγματικές έξοδοι (μόνο αληθινοί άνθρωποι)', 'Real outings (real people only)')}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
              </p>
              <p className="mt-1 text-sm font-bold text-ink md:text-base">{value}</p>
              <p className="text-2xs font-medium text-ink-muted">{hint}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const pending = strikes.filter((s) => s.appeal?.status === 'pending').sort((a, b) => (a.appeal!.at < b.appeal!.at ? -1 : 1));
  const underReview = users.filter((u) => standingFor(strikes, u.id).level === 'review');
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(intlLocale(language));

  return (
    <section aria-labelledby="admin-appeals-title" className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 id="admin-appeals-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <Gavel className="h-4 w-4" aria-hidden /> {t('Ενστάσεις για απουσίες & ακυρώσεις', 'Appeals for absences & cancels')}
      </h2>
      {pending.length === 0 ? (
        <p className="text-xs font-medium text-ink-muted">{t('Καμία ένσταση σε αναμονή.', 'No pending appeals.')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {pending.map((s) => {
            const u = users.find((x) => x.id === s.userId);
            const e = events.find((x) => x.id === s.eventId);
            return (
              <li key={s.id} className="py-3">
                <p className="text-sm font-bold text-ink">
                  {u?.name ?? s.userId} · {strikeLabel(s.kind, t)}
                  {e ? ` · ${e.title}` : ''}
                </p>
                <p className="text-2xs font-medium text-ink-muted">
                  {fmt(s.at)} · {s.reliabilityDelta} {t('αξιοπιστία', 'reliability')} · {t('ένσταση', 'appeal')} {fmt(s.appeal!.at)}
                </p>
                <blockquote className="mt-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-ink">{s.appeal!.text}</blockquote>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      decideAppeal(s.id, true);
                      toast.success(t('Η ένσταση έγινε δεκτή — οι πόντοι επέστρεψαν', 'Appeal upheld — points restored'));
                    }}
                  >
                    {t('Αποδοχή', 'Uphold')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      decideAppeal(s.id, false);
                      toast.success(t('Η ένσταση απορρίφθηκε', 'Appeal rejected'));
                    }}
                  >
                    {t('Απόρριψη', 'Reject')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-border pt-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-ink">
          <ShieldAlert className="h-4 w-4" aria-hidden /> {t('Λογαριασμοί σε έλεγχο (3+ παραλείψεις σε 90 ημέρες)', 'Accounts under review (3+ misses in 90 days)')}
        </h3>
        {underReview.length === 0 ? (
          <p className="mt-1 text-xs font-medium text-ink-muted">{t('Κανένας.', 'None.')}</p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {underReview.map((u) => (
              <li key={u.id} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-ink">
                {u.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
