import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import { TabBar } from '../common/TabBar';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { ShieldCheck, Phone, Mail, CreditCard, UserCheck, TrendingUp, History as HistoryIcon } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { reliabilityBadge, tierLabelEl, tierLabelEn } from '../../lib/trust';
import type { TrustTier } from '../../types';
import { StandingCard } from '../outings/StandingCard';
import { APP_TYPO } from '../../lib/typographyTokens';

const TRUST_TIERS: TrustTier[] = ['1_explorer', '2_confirmed', '3_high_trust'];

function ReliabilityRing({
  score,
  size,
  track,
  stroke,
}: {
  score: number;
  size: number;
  track: string;
  stroke: string;
}) {
  const sw = 6;
  const r = size / 2 - sw;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function TrustCenterPageContent() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const currentUser = useStore((s) => s.currentUser);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const [tab, setTab] = useState<'status' | 'history'>('status');

  /** Φ25 — live trust history (replaces the hardcoded timeline). */
  const history = useMemo(() => {
    if (!currentUser) return [];
    const locale = language === 'el' ? elLocale : enUS;
    const fmt = (iso: string) => {
      try {
        return format(parseISO(iso), 'd MMM yyyy', { locale });
      } catch {
        return iso;
      }
    };
    const titleOf = (id: string) => events.find((e) => e.id === id)?.title ?? id;
    const items: { at: string; el: string; en: string; positive: boolean }[] = [];
    for (const f of Object.values(feedbackSubmitted)) {
      const noShow = f.attendance === 'no_show' || f.attendance === 'late_cancel';
      items.push({
        at: f.submittedAt,
        el: `Αξιολόγησες «${titleOf(f.eventId)}» (${f.overallRating}/5)${noShow ? ' — καταγράφηκε απουσία' : ''}`,
        en: `You reviewed "${titleOf(f.eventId)}" (${f.overallRating}/5)${noShow ? ' — absence recorded' : ''}`,
        positive: !noShow,
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    for (const g of groups.filter((x) => x.members.includes(currentUser.id))) {
      const e = events.find((x) => x.id === g.eventId);
      if (!e || e.date > today) continue;
      items.push({ at: e.date, el: `Συμμετοχή σε «${e.title}»`, en: `Joined "${e.title}"`, positive: true });
    }
    return items
      .sort((x, y) => y.at.localeCompare(x.at))
      .slice(0, 12)
      .map((i) => ({ ...i, date: fmt(i.at) }));
  }, [currentUser, events, groups, feedbackSubmitted, language]);

  if (!currentUser) return null;

  const trustTier = (currentUser.trustTier as TrustTier | undefined) ?? '1_explorer';
  const trustTierLabel = t(tierLabelEl(trustTier), tierLabelEn(trustTier));
  const reliabilityScore = currentUser.reliabilityScore ?? 85;
  const badge = reliabilityBadge(reliabilityScore);

  const gaps = [
    !currentUser.emailVerified && {
      key: 'email',
      to: '/verification',
      labelEl: 'Επαλήθευση email',
      labelEn: 'Verify email',
    },
    !currentUser.phoneVerified && {
      key: 'phone',
      to: '/verification',
      labelEl: 'Επαλήθευση τηλεφώνου',
      labelEn: 'Verify phone',
    },
    !currentUser.paymentVerified && {
      key: 'payment',
      to: '/wallet',
      labelEl: 'Άνοιγμα πορτοφολιού',
      labelEn: 'Open wallet',
    },
    !currentUser.idVerified && {
      key: 'id',
      to: '/verification',
      labelEl: 'Επαλήθευση ταυτότητας',
      labelEn: 'Verify ID',
    },
  ].filter(Boolean) as { key: string; to: string; labelEl: string; labelEn: string }[];
  const primaryGap = gaps[0];
  const checks = [
    { key: 'email', icon: Mail, labelEl: 'Email', labelEn: 'Email', ok: Boolean(currentUser.emailVerified), to: '/verification' },
    { key: 'phone', icon: Phone, labelEl: 'Τηλέφωνο', labelEn: 'Phone', ok: Boolean(currentUser.phoneVerified), to: '/verification' },
    { key: 'payment', icon: CreditCard, labelEl: 'Πληρωμή', labelEn: 'Payment', ok: Boolean(currentUser.paymentVerified), to: '/wallet' },
    { key: 'id', icon: UserCheck, labelEl: 'Ταυτότητα', labelEn: 'Government ID', ok: Boolean(currentUser.idVerified), to: '/verification' },
  ];

  const tierBenefits: Record<TrustTier, { el: string; en: string }> = {
    '1_explorer': { el: 'δωρεάν δημόσιες εκδηλώσεις.', en: 'free public events.' },
    '2_confirmed': { el: 'μικρές ομάδες 3–5 & εκδηλώσεις με εισιτήριο.', en: 'small groups of 3–5 & ticketed events.' },
    '3_high_trust': { el: 'εκδρομές, ιδιωτικές συναντήσεις & διοργάνωση.', en: 'trips, private meetups & hosting.' },
  };

  return (
    <div className="mx-auto max-w-full space-y-4 md:space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Κέντρο Εμπιστοσύνης', 'Trust Center')}</h1>
        <p className={cn(APP_TYPO.pageSub, 'mt-1 leading-snug', a.sub)}>
          {primaryGap
            ? t(
                `${gaps.length === 1 ? '1 εκκρεμότητα' : `${gaps.length} εκκρεμότητες`} · ${primaryGap.labelEl}.`,
                `${gaps.length === 1 ? '1 open item' : `${gaps.length} open items`} · ${primaryGap.labelEn}.`,
              )
            : t('Επαληθεύσεις και παρουσίες — όλα εντάξει.', 'Verifications and attendance — all clear.')}
        </p>
      </div>

      <TabBar
        variant="segmented"
        idBase="trust"
        ariaLabel={t('Ενότητες εμπιστοσύνης', 'Trust sections')}
        activeTab={tab}
        onChange={(id) => setTab(id as 'status' | 'history')}
        tabs={[
          { id: 'status', label: t('Κατάσταση', 'Status'), icon: ShieldCheck },
          { id: 'history', label: t('Ιστορικό', 'History'), icon: HistoryIcon, count: history.length },
        ]}
      />

      {tab === 'status' && (
      <div role="tabpanel" id="trust-panel-status" aria-labelledby="trust-tab-status" className="space-y-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={reliabilityScore}
              aria-label={t('Βαθμός αξιοπιστίας', 'Reliability score')}
            >
              <ReliabilityRing
                score={reliabilityScore}
                size={64}
                track={a.isDark ? '#374151' : '#e5e7eb'}
                stroke={a.scoreStroke}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(APP_TYPO.statValue, a.head)}>{reliabilityScore}%</p>
              <p className={cn('text-xs font-bold leading-snug', a.head)}>{t(badge.el, badge.en)}</p>
              <p className={cn('text-xs font-medium', a.muted)}>{trustTierLabel}</p>
            </div>
            {primaryGap && (
              <Button
                size="md"
                type="button"
                onClick={() => navigate(primaryGap.to)}
                className="hidden shrink-0 sm:inline-flex"
              >
                {t(primaryGap.labelEl, primaryGap.labelEn)}
              </Button>
            )}
          </div>
          {primaryGap && (
            <Button
              size="md"
              type="button"
              onClick={() => navigate(primaryGap.to)}
              className="mt-3 w-full sm:hidden"
            >
              {t(primaryGap.labelEl, primaryGap.labelEn)}
            </Button>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 space-y-3">
            <div>
              <h2 className={cn('text-sm font-bold tracking-tight mb-0.5 flex items-center gap-1.5', a.head)}>
                <ShieldCheck className={cn('h-4 w-4', a.iconAccent)} />{t('Κατάσταση Επαλήθευσης', 'Verification Status')}
              </h2>
              <p className={cn('card-prose font-semibold', a.muted)}>{trustTierLabel}</p>
            </div>

            <div className="space-y-1">
              {checks.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.key} className="flex min-h-8 items-center justify-between gap-2">
                    <div className={cn('flex items-center gap-2 card-prose font-medium', a.sub)}>
                      <Icon className={cn('h-3.5 w-3.5', a.muted)} /> {t(row.labelEl, row.labelEn)}
                    </div>
                    {row.ok ? (
                      <Badge variant="success" className="text-xs px-2 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(row.to)}
                        className={cn('inline-flex min-h-8 items-center text-xs font-bold tracking-wide', a.link)}
                      >
                        {t('Επαλήθευση', 'Verify')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="space-y-3">
            <Card className={a.infoBg}>
              <div className="p-4">
                <h3 className={cn('text-sm font-bold tracking-tight mb-1.5', a.head)}>{t('Πώς υπολογίζεται η αξιοπιστία', 'How reliability is calculated')}</h3>
                <p className={cn('card-prose font-medium leading-snug', a.sub)}>
                  {t(
                    'Ο βαθμός (0–100) κινείται με παρουσίες και αξιολογήσεις. Οι επαληθεύσεις ανεβάζουν το επίπεδο και ξεκλειδώνουν εκδηλώσεις.',
                    'The score (0–100) moves with attendance and reviews. Verifications raise your tier and unlock events.',
                  )}
                </p>
                <ul className={cn('mt-2.5 space-y-1 card-prose font-medium tabular-nums sm:grid sm:grid-cols-2 sm:gap-x-4 sm:space-y-0', a.sub)}>
                  <li className="flex gap-2"><span className="w-7 shrink-0 font-bold text-emerald-600 dark:text-emerald-400">+3</span>{t('επιβεβαιωμένη παρουσία', 'confirmed attendance')}</li>
                  <li className="flex gap-2"><span className="w-7 shrink-0 font-bold text-emerald-600 dark:text-emerald-400">+2</span>{t('καλή αξιολόγηση (4–5★)', 'good rating (4–5★)')}</li>
                  <li className="flex gap-2"><span className="w-7 shrink-0 font-bold text-red-600 dark:text-red-400">−8</span>{t('ακύρωση τελευταίας στιγμής', 'last-minute cancel')}</li>
                  <li className="flex gap-2"><span className="w-7 shrink-0 font-bold text-red-600 dark:text-red-400">−15</span>{t('απουσία (no-show)', 'no-show')}</li>
                </ul>
              </div>
            </Card>
            <Card className={a.infoBg}>
              <div className="p-4">
                <h3 className={cn('text-sm font-bold tracking-tight mb-1.5', a.head)}>{t('Τα 3 επίπεδα εμπιστοσύνης', 'The 3 trust tiers')}</h3>
                <ol className={cn('card-prose font-medium leading-snug space-y-1.5', a.sub)}>
                  {TRUST_TIERS.map((tier, index) => {
                    const current = tier === trustTier;
                    return (
                      <li
                        key={tier}
                        className={cn(current && cn('rounded-xl px-2 py-1 -mx-2', a.highlightRow))}
                      >
                        <strong className={a.head}>
                          {index + 1} · {t(tierLabelEl(tier), tierLabelEn(tier))}
                          {current ? ` · ${t('τώρα', 'now')}` : ''}
                        </strong>
                        {' '}
                        {t(tierBenefits[tier].el, tierBenefits[tier].en)}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Card>
          </div>
        </div>

        <StandingCard />

        <CopilotInlinePrompt
          title={{ el: 'Ρώτα το AI για την εμπιστοσύνη σου', en: 'Ask the AI about your trust' }}
          subtitle={{ el: 'Εξηγεί τον βαθμό σου και τι λείπει', en: 'Explains your score and what’s missing' }}
          maxChips={2}
        />
      </div>
      )}

      {tab === 'history' && (
      <Card className="p-4" role="tabpanel" id="trust-panel-history" aria-labelledby="trust-tab-history">
        <h2 className={cn('text-sm font-bold tracking-tight mb-3 flex items-center gap-1.5', a.head)}>
          <TrendingUp className={cn('w-4 h-4', a.iconAccent)} aria-hidden />{t('Ιστορικό Εμπιστοσύνης', 'Trust History')}
        </h2>
        {history.length === 0 ? (
          <div className="space-y-3">
            <p className={cn('card-copy', a.muted)}>
              {t('Δεν υπάρχει ακόμη ιστορικό. Οι συμμετοχές και οι αξιολογήσεις σου θα εμφανίζονται εδώ.', 'No history yet. Your attendance and reviews will appear here.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className={cn('inline-flex min-h-8 items-center text-xs font-bold tracking-wide', a.link)}
              >
                {t('Εξερεύνηση εκδηλώσεων', 'Explore events')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/buddy-seek')}
                className={cn('inline-flex min-h-8 items-center text-xs font-bold tracking-wide underline underline-offset-2', a.muted)}
              >
                {t('Βρες Nakamas', 'Find Nakamas')}
              </button>
            </div>
          </div>
        ) : (
          <ol className="space-y-0">
            {history.map((item, i) => (
              <li key={`${item.at}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center" aria-hidden>
                  <div className={cn('w-2 h-2 rounded-full mt-1.5', item.positive ? a.timelineDot : 'bg-red-400')} />
                  {i < history.length - 1 && <div className={cn('w-px flex-1', a.timelineLine)} />}
                </div>
                <div className="pb-4">
                  <p className={cn('card-prose font-medium', a.head)}>{t(item.el, item.en)}</p>
                  <time dateTime={item.at} className={cn('text-xs font-medium', a.muted)}>{item.date}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
      )}
    </div>
  );
}
