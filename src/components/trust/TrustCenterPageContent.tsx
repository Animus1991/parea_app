import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import { TabBar } from '../common/TabBar';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { ShieldCheck, Phone, Mail, CreditCard, Award, UserCheck, TrendingUp, History as HistoryIcon } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import type { TrustTier } from '../../types';
import { StandingCard } from '../outings/StandingCard';

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
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 12)
      .map((i) => ({ ...i, date: fmt(i.at) }));
  }, [currentUser, events, groups, feedbackSubmitted, language]);

  if (!currentUser) return null;

  const trustTierLabel = currentUser.trustTier
    ? t(tierLabelEl(currentUser.trustTier as TrustTier), tierLabelEn(currentUser.trustTier as TrustTier))
    : t('Νέος', 'Newcomer');
  const reliabilityScore = currentUser.reliabilityScore ?? 85;
  const circumference = 2 * Math.PI * 52;
  const strokeDash = (reliabilityScore / 100) * circumference;


  return (
    <div className="mx-auto max-w-full space-y-4 md:space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 className={cn("text-sm md:text-base font-bold tracking-tight leading-tight", a.head)}>{t('Κέντρο Εμπιστοσύνης', 'Trust Center')}</h1>
        <p className={cn("mt-2 text-sm font-medium leading-relaxed max-w-xl", a.sub)}>
          {t('Η αξιοπιστία σας βασίζεται στις επαληθεύσεις και τις αξιολογήσεις σας.', 'Your trust score is based on your verifications and reviews.')}
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Verification Status */}
        <Card className="p-5 space-y-5">
          <div>
            <h2 className={cn("text-xs font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5", a.muted)}>
              <ShieldCheck className={cn("h-3.5 w-3.5", a.iconAccent)} />{t('Κατάσταση Επαλήθευσης', 'Verification Status')}
            </h2>
            <p className={cn("card-heading-lg font-bold", a.head)}>{trustTierLabel}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-medium", a.sub)}>
                <Mail className={cn("h-3.5 w-3.5", a.muted)} /> {t('Email', 'Email')}
              </div>
              {currentUser.emailVerified ? (
                <Badge variant="success" className="text-xs px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
              ) : (
                <button type="button" onClick={() => navigate('/verification')} className={cn("text-xs font-bold cursor-pointer tracking-wide", a.link)}>
                  {t('Επαλήθευση', 'Verify')}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-medium", a.sub)}>
                <Phone className={cn("h-3.5 w-3.5", a.muted)} />{t('Τηλέφωνο', 'Phone')}
              </div>
              {currentUser.phoneVerified ? (
                <Badge variant="success" className="text-xs px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
              ) : (
                <button type="button" onClick={() => navigate('/verification')} className={cn("text-xs font-bold cursor-pointer tracking-wide", a.link)}>
                  {t('Επαλήθευση', 'Verify')}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-medium", a.sub)}>
                <CreditCard className={cn("h-3.5 w-3.5", a.muted)} />{t('Πληρωμή', 'Payment')}
              </div>
              {currentUser.paymentVerified ? (
                <Badge variant="success" className="text-xs px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
              ) : (
                <button type="button" onClick={() => navigate('/wallet')} className={cn("text-xs font-bold cursor-pointer tracking-wide", a.link)}>
                  {t('Άνοιγμα πορτοφολιού', 'Open wallet')}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-medium", a.sub)}>
                <UserCheck className={cn("h-3.5 w-3.5", a.muted)} />{t('Ταυτότητα', 'Government ID')}
              </div>
              {currentUser.idVerified ? (
                <Badge variant="success" className="text-xs px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
              ) : (
                <button type="button" onClick={() => navigate('/verification')} className={cn("text-xs font-bold cursor-pointer tracking-wide", a.link)}>
                  {t('Επαλήθευση', 'Verify')}
                </button>
              )}
            </div>
          </div>

          <div className={cn("pt-4 border-t", a.isDark ? "border-gray-700/40" : "border-gray-100")}>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-bold", a.head)}>
                <Award className="h-4 w-4 text-amber-500" />{t('Βαθμός Αξιοπιστίας', 'Reliability Score')}
              </div>
              <span className="text-sm md:text-base font-black tabular-nums leading-none text-emerald-600">{reliabilityScore}%</span>
            </div>
            <p className={cn("text-sm mt-1.5 font-medium leading-relaxed", a.sub)}>
              {t('Βασίζεται στις παρουσίες, αξιολογήσεις και συμπεριφορά σας.', 'Based on your attendance, reviews, and behavior.')}
            </p>
          </div>
        </Card>

        {/* Radial Score + Info */}
        <div className="space-y-3">
          <Card className="p-5 flex flex-col items-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="mb-2">
              <circle cx="60" cy="60" r="52" fill="none" stroke={a.isDark ? '#374151' : '#e5e7eb'} strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={a.scoreStroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} transform="rotate(-90 60 60)" />
              <text x="60" y="56" textAnchor="middle" className={cn("text-sm md:text-base font-black", a.scoreFill)} fontSize="14">{reliabilityScore}</text>
              <text x="60" y="74" textAnchor="middle" className="fill-gray-400" fontSize="10" fontWeight="600">%</text>
            </svg>
            <p className={cn("text-xs font-bold tracking-wide", a.muted)}>{t('Βαθμός Αξιοπιστίας', 'Reliability Score')}</p>
          </Card>

          <Card className={a.infoBg}>
            <div className="p-4 md:p-5">
              <h3 className={cn("text-xs font-bold tracking-wide mb-1.5", a.head)}>{t('Πώς υπολογίζεται η αξιοπιστία', 'How reliability is calculated')}</h3>
              <p className={cn("card-copy leading-relaxed", a.sub)}>
                {t('Κάθε επαλήθευση αυξάνει το επίπεδο εμπιστοσύνης σας, ξεκλειδώνοντας πρόσβαση σε εκδηλώσεις υψηλής ασφάλειας.', 'Each verification raises your trust tier, unlocking access to high-safety events.')}
              </p>
              <ul className={cn("mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-medium tabular-nums", a.sub)}>
                <li><span className="font-bold text-emerald-600 dark:text-emerald-400">+3</span> {t('επιβεβαιωμένη παρουσία', 'confirmed attendance')}</li>
                <li><span className="font-bold text-emerald-600 dark:text-emerald-400">+2</span> {t('καλή αξιολόγηση (4–5★)', 'good rating (4–5★)')}</li>
                <li><span className="font-bold text-red-600 dark:text-red-400">−8</span> {t('ακύρωση τελευταίας στιγμής', 'last-minute cancel')}</li>
                <li><span className="font-bold text-red-600 dark:text-red-400">−15</span> {t('απουσία (no-show)', 'no-show')}</li>
              </ul>
            </div>
          </Card>
          <Card className={a.infoBg}>
            <div className="p-4 md:p-5">
              <h3 className={cn("text-xs font-bold tracking-wide mb-1.5", a.head)}>{t('Τα 3 επίπεδα εμπιστοσύνης', 'The 3 trust tiers')}</h3>
              <ol className={cn("card-copy leading-relaxed space-y-1", a.sub)}>
                <li><strong className={a.head}>1 · {t(tierLabelEl('1_explorer'), tierLabelEn('1_explorer'))}:</strong> {t('δωρεάν δημόσιες εκδηλώσεις.', 'free public events.')}</li>
                <li><strong className={a.head}>2 · {t(tierLabelEl('2_confirmed'), tierLabelEn('2_confirmed'))}:</strong> {t('μικρές ομάδες 3–5 & εκδηλώσεις με εισιτήριο.', 'small groups of 3–5 & ticketed events.')}</li>
                <li><strong className={a.head}>3 · {t(tierLabelEl('3_high_trust'), tierLabelEn('3_high_trust'))}:</strong> {t('εκδρομές, ιδιωτικές συναντήσεις & διοργάνωση.', 'trips, private meetups & hosting.')}</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>

      {/* Φ27 — graduated consequences, explained, with appeals. */}
      <StandingCard />

      <CopilotInlinePrompt
        title={{ el: 'Ρώτα το AI για την εμπιστοσύνη σου', en: 'Ask the AI about your trust' }}
        maxChips={2}
      />
      </div>
      )}

      {tab === 'history' && (
      <Card className="p-5" role="tabpanel" id="trust-panel-history" aria-labelledby="trust-tab-history">
        <h2 className={cn("text-xs font-bold tracking-wide mb-4 flex items-center gap-1.5", a.head)}>
          <TrendingUp className={cn("w-3.5 h-3.5", a.iconAccent)} aria-hidden />{t('Ιστορικό Εμπιστοσύνης', 'Trust History')}
        </h2>
        {history.length === 0 ? (
          <div className="space-y-3">
            <p className={cn("card-copy", a.muted)}>
              {t('Δεν υπάρχει ακόμη ιστορικό. Οι συμμετοχές και οι αξιολογήσεις σου θα εμφανίζονται εδώ.', 'No history yet. Your attendance and reviews will appear here.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className={cn("text-xs font-bold tracking-wide", a.link)}
              >
                {t('Εξερεύνηση εκδηλώσεων', 'Explore events')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/buddy-seek')}
                className={cn("text-xs font-bold tracking-wide underline underline-offset-2", a.muted)}
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
                  <div className={cn("w-2 h-2 rounded-full mt-1.5", item.positive ? a.timelineDot : 'bg-red-400')} />
                  {i < history.length - 1 && <div className={cn("w-px flex-1", a.timelineLine)} />}
                </div>
                <div className="pb-4">
                  <p className={cn("text-sm font-medium", a.head)}>{t(item.el, item.en)}</p>
                  <time dateTime={item.at} className={cn("text-xs font-medium", a.muted)}>{item.date}</time>
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
