import { useState, useMemo, useCallback } from 'react';
import { Trophy, Flame, Calendar, Star, TrendingUp, ChevronUp } from 'lucide-react';
import { Card } from '../components/common/Card';
import { TabBar } from '../components/common/TabBar';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { usePageContrast } from '../hooks/usePageContrast';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

type Period = 'week' | 'month' | 'alltime';

import { computeUserXp, BADGES_CATALOGUE } from '../lib/gamification';

function RankIcon({ rank, mutedClass }: { rank: number; mutedClass: string }) {
  if (rank === 1) return <span className="text-2xl leading-none select-none">🥇</span>;
  if (rank === 2) return <span className="text-2xl leading-none select-none">🥈</span>;
  if (rank === 3) return <span className="text-2xl leading-none select-none">🥉</span>;
  return <span className={cn('text-[14px] font-black tabular-nums w-8 text-center', mutedClass)}>#{rank}</span>;
}

export default function LeaderboardClassic() {
  const { t } = useLanguage();
  const p = usePageContrast();
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState('global');

  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const bonusXp = useStore((s) => s.bonusXp);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const feedbackCount = useMemo(() => Object.keys(feedbackSubmitted).length, [feedbackSubmitted]);

  const xpForUser = useCallback(
    (u: (typeof users)[number], isMe: boolean) =>
      computeUserXp(u, isMe, isMe ? feedbackCount : Math.floor((u.reliabilityScore ?? 50) / 10), isMe ? bonusXp : 0),
    [feedbackCount, bonusXp],
  );

  const allEntries = useMemo(() => {
    const multiplier = period === 'week' ? 0.15 : period === 'month' ? 0.45 : 1;

    const list = users.map((u) => {
      const isMe = u.id === currentUser?.id;
      return {
        id: u.id,
        name: u.name,
        avatar: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`,
        xp: Math.round(xpForUser(u, isMe) * multiplier),
        streak: Math.min((isMe ? feedbackCount : (u.connections?.length ?? 0)) * 2, 14),
        eventsCount: isMe ? feedbackCount : Math.floor((u.reliabilityScore ?? 50) / 10),
        reliabilityScore: u.reliabilityScore ?? 50,
        isMe,
      };
    });

    if (currentUser && !users.find((u) => u.id === currentUser.id)) {
      list.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.photoUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`,
        xp: Math.round(xpForUser(currentUser, true) * multiplier),
        streak: Math.min(feedbackCount * 2, 14),
        eventsCount: feedbackCount,
        reliabilityScore: currentUser.reliabilityScore ?? 80,
        isMe: true,
      });
    }

    return list.sort((a, b) => b.xp - a.xp);
  }, [users, currentUser, feedbackCount, period, xpForUser]);

  const friendsEntries = useMemo(
    () => allEntries.filter((e) => e.isMe || (currentUser?.connections ?? []).includes(e.id)),
    [allEntries, currentUser],
  );

  const displayEntries = activeTab === 'friends' ? friendsEntries : allEntries;
  const myRank = allEntries.findIndex((e) => e.isMe) + 1;
  const myEntry = allEntries.find((e) => e.isMe);
  const aheadEntry = myRank > 1 ? allEntries[myRank - 2] : null;
  const xpToNext = aheadEntry && myEntry ? Math.max(0, aheadEntry.xp - myEntry.xp) : 0;
  const nextPct = aheadEntry && myEntry && aheadEntry.xp > 0
    ? Math.max(6, Math.min(100, Math.round((myEntry.xp / aheadEntry.xp) * 100)))
    : 100;

  const tabs = [
    { id: 'global', label: t('Παγκόσμια', 'Global') },
    { id: 'friends', label: t('Φίλοι', 'Friends') },
    { id: 'badges', label: t('Badges', 'Badges') },
  ];

  return (
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn('text-[16px] md:text-[18px] font-bold', p.head)}>{t('Κατάταξη', 'Leaderboard')}</h1>
          <p className={cn('font-medium text-[13px] md:text-sm mt-1', p.sub)}>
            {t('Δες πού βρίσκεσαι μέσα στην κοινότητα', 'See where you stand in the community')}
          </p>
        </div>
        <div className={cn('flex gap-1 rounded-xl p-1 self-start', p.isDark ? 'bg-white/5' : 'bg-gray-100')}>
          {(['week', 'month', 'alltime'] as Period[]).map((per) => (
            <button
              key={per}
              onClick={() => setPeriod(per)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 whitespace-nowrap',
                period === per
                  ? cn(p.cardSurface, p.head, 'shadow-soft')
                  : cn(p.muted, p.hoverText),
              )}
            >
              {per === 'week' ? t('Εβδομάδα', 'Week') : per === 'month' ? t('Μήνας', 'Month') : t('Όλα', 'All Time')}
            </button>
          ))}
        </div>
      </div>

      {/* My rank summary card */}
      {myEntry && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className={cn('p-4', p.highlightRow)}>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={myEntry.avatar}
                  alt={myEntry.name}
                  className={cn('w-14 h-14 rounded-full object-cover ring-2', p.isDark ? 'ring-white/20' : 'ring-[#18D8DB]/40')}
                />
                <div className="absolute -bottom-1 -right-1 bg-[#111827] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                  #{myRank}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-bold text-[13.5px]', p.head)}>
                  {t('Η κατάταξή σου', 'Your rank')} —{' '}
                  <span className={p.statVal}>#{myRank}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className={cn('text-[12px] flex items-center gap-1 font-medium', p.muted)}>
                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> {myEntry.xp} XP
                  </span>
                  <span className={cn('text-[12px] flex items-center gap-1 font-medium', p.muted)}>
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> {myEntry.streak} {t('εβδ. σερί', 'wk streak')}
                  </span>
                  <span className={cn('text-[12px] flex items-center gap-1 font-medium', p.muted)}>
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" /> {myEntry.eventsCount}{' '}
                    {t('εκδηλώσεις', 'events')}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress to next rank */}
            {aheadEntry ? (
              <div className={cn('mt-4 pt-3 border-t', p.borderT)}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn('text-[11.5px] font-semibold flex items-center gap-1', p.muted)}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t(`${xpToNext} XP για #${myRank - 1}`, `${xpToNext} XP to reach #${myRank - 1}`)}
                  </span>
                  <span className={cn('text-[11.5px] font-bold', p.statVal)}>{nextPct}%</span>
                </div>
                <div className={cn('h-2 rounded-full overflow-hidden', p.progressBg)}>
                  <motion.div
                    className={cn('h-full rounded-full', p.progressFill)}
                    initial={{ width: 0 }}
                    animate={{ width: `${nextPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ) : (
              <div className={cn('mt-4 pt-3 border-t flex items-center gap-1.5 text-[12px] font-bold', p.borderT, p.statVal)}>
                <ChevronUp className="w-4 h-4" /> {t('Είσαι στην κορυφή! 🏆', "You're at the top! 🏆")}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Leaderboard table */}
      {activeTab !== 'badges' && (
        <div className="space-y-2">
          {displayEntries.map((entry, index) => {
            const rank =
              activeTab === 'global'
                ? index + 1
                : allEntries.findIndex((e) => e.id === entry.id) + 1;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    'p-3 flex items-center gap-3 transition-colors',
                    entry.isMe ? p.highlightRow : p.cardHover,
                  )}
                >
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <RankIcon rank={rank} mutedClass={p.muted} />
                  </div>
                  <img
                    referrerPolicy="no-referrer"
                    src={entry.avatar}
                    alt={entry.name}
                    className={cn('w-10 h-10 rounded-full object-cover shrink-0 ring-1', p.isDark ? 'ring-white/10' : 'ring-gray-100')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn('font-bold text-[13.5px] truncate', entry.isMe ? p.statVal : p.head)}>
                        {entry.name}
                      </span>
                      {entry.isMe && (
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0', p.statBg, p.statVal)}>
                          {t('Εσύ', 'You')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={cn('text-[11px] font-medium flex items-center gap-0.5', p.muted)}>
                        <Flame className="w-2.5 h-2.5 text-orange-400" /> {entry.streak}w
                      </span>
                      <span className={cn('text-[11px] font-medium flex items-center gap-0.5', p.muted)}>
                        <Calendar className="w-2.5 h-2.5 text-cyan-400" /> {entry.eventsCount}
                      </span>
                      <span className={cn('text-[11px] font-medium flex items-center gap-0.5', p.muted)}>
                        <Star className="w-2.5 h-2.5 text-amber-400" /> {entry.reliabilityScore}%
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('font-black text-[17px] tabular-nums leading-none', p.head)}>
                      {entry.xp}
                    </p>
                    <p className={cn('text-[10px] font-semibold mt-0.5', p.muted)}>XP</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {displayEntries.length === 0 && (
            <Card className="p-8 text-center">
              <p className={cn('text-sm font-medium', p.muted)}>
                {t('Δεν βρέθηκαν εγγραφές.', 'No entries found.')}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Badges tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES_CATALOGUE.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  'p-4 flex flex-col items-center text-center gap-2 transition-colors',
                  badge.unlocked
                    ? (p.isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50/30')
                    : 'opacity-50 grayscale',
                )}
              >
                <span className="text-3xl leading-none">{badge.emoji}</span>
                <div>
                  <p className={cn('font-bold text-[13px]', badge.unlocked ? p.head : p.muted)}>
                    {t(badge.labelEl, badge.labelEn)}
                  </p>
                  <p className={cn('text-[11px] font-medium mt-0.5 leading-snug', p.muted)}>
                    {t(badge.descriptionEl, badge.descriptionEn)}
                  </p>
                </div>
                {badge.unlocked ? (
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p.isDark ? 'text-amber-300 bg-amber-500/20' : 'text-amber-600 bg-amber-100')}>
                    {t('Ξεκλείδωτο ✓', 'Unlocked ✓')}
                  </span>
                ) : (
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', p.statBg, p.muted)}>
                    {t('Κλειδωμένο', 'Locked')}
                  </span>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
