import { useState, useMemo } from 'react';
import { GamificationHubNav } from '../components/achievements/GamificationHub';
import {
  CheckCircle2,
  Trophy,
  Clock,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { motion } from 'motion/react';
import { usePageContrast } from '../hooks/usePageContrast';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { APP_TYPO } from '../lib/typographyTokens';
import { NakamasMini, type NakamasMiniId } from '../components/illustrations/NakamasMini';
import { CHALLENGE_MINI } from '../components/illustrations/miniMaps';

interface Challenge {
  id: string;
  mini: NakamasMiniId;
  titleGr: string;
  titleEn: string;
  descGr: string;
  descEn: string;
  progress: number;
  goal: number;
  unit: string;
  xp: number;
  daysLeft: number;
  type: 'events' | 'streak' | 'social' | 'explorer';
}

const FILTER_TYPES = ['all', 'events', 'streak', 'social', 'explorer'] as const;
type FilterType = (typeof FILTER_TYPES)[number];

export default function ChallengesClassic() {
  const { t } = useLanguage();
  const p = usePageContrast();
  const [filterType, setFilterType] = useState<FilterType>('all');

  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const challengesJoined = useStore((s) => s.challengesJoined);
  const toggleChallengeJoined = useStore((s) => s.toggleChallengeJoined);
  const joinedIds = useMemo(() => new Set(challengesJoined), [challengesJoined]);

  const feedbackCount = Object.keys(feedbackSubmitted).length;
  const userGroupIds = currentUser
    ? groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId)
    : [];
  const uniqueCategories = new Set(
    events.filter((e) => userGroupIds.includes(e.id)).map((e) => e.category),
  ).size;
  const connectionsCount = currentUser?.connections?.length ?? 0;

  const challenges: Challenge[] = useMemo(
    () => [
      {
        id: 'c1',
        mini: CHALLENGE_MINI.events,
        titleGr: '5 Εκδηλώσεις τον Μήνα',
        titleEn: '5 Events This Month',
        descGr: 'Παρακολούθησε 5 εκδηλώσεις κατά τη διάρκεια του τρέχοντος μήνα.',
        descEn: 'Attend 5 events during the current month.',
        progress: Math.min(feedbackCount, 5),
        goal: 5,
        unit: t('εκδ.', 'events'),
        xp: 200,
        daysLeft: 8,
        type: 'events',
      },
      {
        id: 'c2',
        mini: CHALLENGE_MINI.streak,
        titleGr: 'Σερί 4 Εβδομάδων',
        titleEn: '4-Week Streak',
        descGr: 'Συμμετείχε σε τουλάχιστον μια εκδήλωση κάθε εβδομάδα για 4 συνεχόμενες εβδομάδες.',
        descEn: 'Attend at least one event per week for 4 consecutive weeks.',
        progress: Math.min(feedbackCount, 4),
        goal: 4,
        unit: t('εβδ.', 'weeks'),
        xp: 300,
        daysLeft: 15,
        type: 'streak',
      },
      {
        id: 'c3',
        mini: CHALLENGE_MINI.social,
        titleGr: 'Δικτύωσε 5 Nakamas',
        titleEn: 'Connect with 5 Nakamas',
        descGr: 'Δημιούργησε 5 νέες συνδέσεις με μέλη της κοινότητας.',
        descEn: 'Make 5 new connections with community members.',
        progress: Math.min(connectionsCount, 5),
        goal: 5,
        unit: t('συνδ.', 'connections'),
        xp: 150,
        daysLeft: 22,
        type: 'social',
      },
      {
        id: 'c4',
        mini: CHALLENGE_MINI.explorer,
        titleGr: 'Εξερεύνησε 4 Κατηγορίες',
        titleEn: 'Explore 4 Categories',
        descGr: 'Παρακολούθησε εκδηλώσεις από 4 διαφορετικές κατηγορίες.',
        descEn: 'Attend events from 4 different categories.',
        progress: Math.min(uniqueCategories, 4),
        goal: 4,
        unit: t('κατηγ.', 'categories'),
        xp: 180,
        daysLeft: 30,
        type: 'explorer',
      },
      {
        id: 'c5',
        mini: 'spark',
        titleGr: 'Γρήγορη Εγγραφή ×3',
        titleEn: 'Quick Join ×3',
        descGr: 'Εγγράψου σε εκδήλωση εντός 5 λεπτών από τη δημοσίευσή της, 3 φορές.',
        descEn: 'Join an event within 5 minutes of posting, 3 times.',
        progress: 1,
        goal: 3,
        unit: t('φορές', 'times'),
        xp: 120,
        daysLeft: 14,
        type: 'events',
      },
      {
        id: 'c6',
        mini: 'helper',
        titleGr: 'Κορυφαίος Αξιολογητής',
        titleEn: 'Top Reviewer',
        descGr: 'Αξιολόγησε 3 εκδηλώσεις με αναλυτικό σχόλιο.',
        descEn: 'Rate 3 events with a detailed comment.',
        progress: Math.min(feedbackCount, 3),
        goal: 3,
        unit: t('αξιολογήσεις', 'reviews'),
        xp: 100,
        daysLeft: 20,
        type: 'social',
      },
    ],
    [feedbackCount, connectionsCount, uniqueCategories, t],
  );

  const filtered = filterType === 'all' ? challenges : challenges.filter((c) => c.type === filterType);

  const toggleJoin = (id: string) => {
    const wasJoined = joinedIds.has(id);
    toggleChallengeJoined(id);
    toast.success(
      wasJoined
        ? t('Αποχώρησες από την πρόκληση', 'Left the challenge')
        : t('Μπήκες στην πρόκληση', 'Joined the challenge'),
    );
  };

  const totalXP = challenges.filter((c) => c.progress >= c.goal).reduce((s, c) => s + c.xp, 0);

  const filterLabels: Record<FilterType, { gr: string; en: string }> = {
    all: { gr: 'Όλες', en: 'All' },
    events: { gr: 'Εκδηλώσεις', en: 'Events' },
    streak: { gr: 'Σερί', en: 'Streak' },
    social: { gr: 'Κοινωνικές', en: 'Social' },
    explorer: { gr: 'Εξερεύνηση', en: 'Explorer' },
  };

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <GamificationHubNav />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, p.head)}>
            {t('Προκλήσεις', 'Challenges')}
          </h1>
          <p className={cn(APP_TYPO.pageSub, 'mt-1', p.sub)}>
            {t('Κέρδισε XP και ξεκλείδωσε badges', 'Earn XP and unlock badges')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 self-start">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-amber-600 font-bold">{t('XP Ολοκληρωμένων', 'Completed XP')}</p>
            <p className="card-heading-lg font-bold text-amber-700 leading-none">{totalXP}</p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 noscrollbar"
        role="tablist"
        aria-label={t('Φίλτρα προκλήσεων', 'Challenge filters')}
      >
        {FILTER_TYPES.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filterType === f}
            onClick={() => setFilterType(f)}
            className={cn(
              'whitespace-nowrap px-4 py-1.5 min-h-8 rounded-full text-xs font-bold transition-all duration-200 border',
              filterType === f ? p.chipActive : p.chipInactive,
            )}
          >
            {t(filterLabels[f].gr, filterLabels[f].en)}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c, i) => {
          const pct = Math.round((c.progress / c.goal) * 100);
          const done = c.progress >= c.goal;
          const joined = joinedIds.has(c.id);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
            >
              <Card className={`p-4 flex flex-col gap-3 h-full ${done ? 'border-green-200 bg-green-50/20' : ''}`}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <NakamasMini id={c.mini} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn('card-heading font-bold', p.head)}>
                        {t(c.titleGr, c.titleEn)}
                      </h3>
                      {done && (
                        <span className="card-meta font-semibold text-green-700 dark:text-green-400 inline-flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 className="w-3 h-3" aria-hidden /> {t('Ολοκληρώθηκε', 'Done')}
                        </span>
                      )}
                    </div>
                    <p className={cn('card-copy font-medium mt-0.5 leading-snug', p.sub)}>
                      {t(c.descGr, c.descEn)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="card-meta font-bold text-amber-700 dark:text-amber-400">+{c.xp} XP</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn('card-meta font-medium', p.muted)}>
                      {c.progress} / {c.goal} {c.unit}
                    </span>
                    <span className="card-meta font-bold text-brand">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        done ? 'bg-green-500' : 'bg-gradient-to-r from-accent to-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className={cn('card-meta font-medium flex items-center gap-1', p.muted)}>
                    <Clock className="w-3 h-3" aria-hidden />
                    {c.daysLeft} {t('ημέρες απομένουν', 'days left')}
                  </span>
                  {!done && (
                    <button
                      onClick={() => toggleJoin(c.id)}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-200 ${
                        joined
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15'
                          : 'bg-ink text-white hover:bg-black'
                      }`}
                    >
                      {joined ? t('Αποχώρηση', 'Leave') : t('Συμμετοχή', 'Join')}
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
