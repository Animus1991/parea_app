import { useState, useMemo } from 'react';
import { Trophy, Flame, Calendar, Star } from 'lucide-react';
import { Card } from '../components/common/Card';
import { TabBar } from '../components/common/TabBar';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { motion } from 'motion/react';

type Period = 'week' | 'month' | 'alltime';

function computeXP(
  user: { reliabilityScore?: number; badges?: string[]; connections?: string[] },
  isMe: boolean,
  feedbackCount: number,
): number {
  const base = (user.reliabilityScore ?? 50) * 2;
  const badgesBonus = (user.badges?.length ?? 0) * 50;
  const eventsBonus = isMe ? feedbackCount * 50 : Math.floor((user.reliabilityScore ?? 50) / 10) * 30;
  return base + badgesBonus + eventsBonus;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl leading-none select-none">🥇</span>;
  if (rank === 2) return <span className="text-2xl leading-none select-none">🥈</span>;
  if (rank === 3) return <span className="text-2xl leading-none select-none">🥉</span>;
  return <span className="text-[14px] font-black text-gray-400 tabular-nums w-8 text-center">#{rank}</span>;
}

const BADGES_CATALOGUE = [
  { id: 'b1', emoji: '🏅', gr: 'Πρώτη Εμπειρία', en: 'First Timer', dgr: 'Παρακολούθησες 1η εκδήλωση', den: 'Attended your first event', unlocked: true },
  { id: 'b2', emoji: '🦋', gr: 'Κοινωνική Πεταλούδα', en: 'Social Butterfly', dgr: 'Εντάχθηκες σε 3 ομάδες', den: 'Joined 3 different groups', unlocked: true },
  { id: 'b3', emoji: '⭐', gr: 'Αστέρι Αξιοπιστίας', en: 'Reliability Star', dgr: 'Διατήρησε 90%+ αξιοπιστία', den: 'Maintained 90%+ reliability', unlocked: false },
  { id: 'b4', emoji: '🔥', gr: 'Φλόγα', en: 'On Fire', dgr: 'Ενεργός 4 εβδομάδες σερί', den: '4 consecutive active weeks', unlocked: false },
  { id: 'b5', emoji: '🌍', gr: 'Εξερευνητής', en: 'Explorer', dgr: 'Δοκίμασες 4 κατηγορίες', den: 'Tried 4 different categories', unlocked: true },
  { id: 'b6', emoji: '🎯', gr: 'Πρωτοπόρος', en: 'Trailblazer', dgr: 'Δημιούργησες γεμάτη ομάδα', den: 'Created a full group', unlocked: false },
  { id: 'b7', emoji: '⚡', gr: 'Αστραπή', en: 'Lightning', dgr: 'Εγγραφή εντός 1 λεπτού', den: 'Joined within 1 minute of posting', unlocked: false },
  { id: 'b8', emoji: '🏆', gr: 'Πρωταθλητής', en: 'Champion', dgr: 'Top 3 στη κατάταξη', den: 'Top 3 on leaderboard', unlocked: false },
];

export default function LeaderboardClassic() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState('global');

  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  const feedbackCount = Object.keys(feedbackSubmitted).length;

  const allEntries = useMemo(() => {
    const multiplier = period === 'week' ? 0.15 : period === 'month' ? 0.45 : 1;

    const list = users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.photoUrl || `https://i.pravatar.cc/150?u=${u.id}`,
      xp: Math.round(computeXP(u, u.id === currentUser?.id, feedbackCount) * multiplier),
      streak: Math.min((u.connections?.length ?? 0) * 2, 14),
      eventsCount: u.id === currentUser?.id ? feedbackCount : Math.floor((u.reliabilityScore ?? 50) / 10),
      reliabilityScore: u.reliabilityScore ?? 50,
      isMe: u.id === currentUser?.id,
    }));

    if (currentUser && !users.find((u) => u.id === currentUser.id)) {
      list.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.photoUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`,
        xp: Math.round(computeXP(currentUser, true, feedbackCount) * multiplier),
        streak: Math.min(feedbackCount * 2, 14),
        eventsCount: feedbackCount,
        reliabilityScore: currentUser.reliabilityScore ?? 80,
        isMe: true,
      });
    }

    return list.sort((a, b) => b.xp - a.xp);
  }, [users, currentUser, feedbackCount, period]);

  const friendsEntries = useMemo(
    () => allEntries.filter((e) => e.isMe || (currentUser?.connections ?? []).includes(e.id)),
    [allEntries, currentUser],
  );

  const displayEntries = activeTab === 'friends' ? friendsEntries : allEntries;
  const myRank = allEntries.findIndex((e) => e.isMe) + 1;
  const myEntry = allEntries.find((e) => e.isMe);

  const tabs = [
    { id: 'global', label: t('Παγκόσμια', 'Global') },
    { id: 'friends', label: t('Φίλοι', 'Friends') },
    { id: 'badges', label: t('Badges', 'Badges') },
  ];

  return (
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] md:text-[18px] font-bold text-[#111827]">{t('Κατάταξη', 'Leaderboard')}</h1>
          <p className="text-gray-500 font-medium text-[13px] md:text-sm mt-1">
            {t('Δες πού βρίσκεσαι μέσα στην κοινότητα', 'See where you stand in the community')}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
          {(['week', 'month', 'alltime'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 whitespace-nowrap ${
                period === p ? 'bg-white text-[#111827] shadow-soft' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'week' ? t('Εβδομάδα', 'Week') : p === 'month' ? t('Μήνας', 'Month') : t('Όλα', 'All Time')}
            </button>
          ))}
        </div>
      </div>

      {/* My rank summary card */}
      {myEntry && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="p-4 bg-gradient-to-r from-cyan-50 to-white border-[#a5f3fc]/70">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={myEntry.avatar}
                  alt={myEntry.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-[#18D8DB]/40"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#111827] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                  #{myRank}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#111827] text-[13.5px]">
                  {t('Η κατάταξή σου', 'Your rank')} —{' '}
                  <span className="text-[#0E8B8D]">#{myRank}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="text-[12px] text-gray-500 flex items-center gap-1 font-medium">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> {myEntry.xp} XP
                  </span>
                  <span className="text-[12px] text-gray-500 flex items-center gap-1 font-medium">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> {myEntry.streak} {t('εβδ. σερί', 'wk streak')}
                  </span>
                  <span className="text-[12px] text-gray-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" /> {myEntry.eventsCount}{' '}
                    {t('εκδηλώσεις', 'events')}
                  </span>
                </div>
              </div>
            </div>
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
                  className={`p-3 flex items-center gap-3 transition-colors ${
                    entry.isMe ? 'border-[#18D8DB]/50 bg-cyan-50/40' : 'hover:border-gray-200'
                  }`}
                >
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <RankIcon rank={rank} />
                  </div>
                  <img
                    referrerPolicy="no-referrer"
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-bold text-[13.5px] truncate ${
                          entry.isMe ? 'text-[#0E8B8D]' : 'text-[#111827]'
                        }`}
                      >
                        {entry.name}
                      </span>
                      {entry.isMe && (
                        <span className="text-[10px] font-bold text-[#18D8DB] bg-cyan-50 px-1.5 py-0.5 rounded-full shrink-0">
                          {t('Εσύ', 'You')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-orange-400" /> {entry.streak}w
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5 text-cyan-400" /> {entry.eventsCount}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400" /> {entry.reliabilityScore}%
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-[#111827] text-[17px] tabular-nums leading-none">
                      {entry.xp}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">XP</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {displayEntries.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-400 text-sm font-medium">
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
                className={`p-4 flex flex-col items-center text-center gap-2 transition-colors ${
                  badge.unlocked ? 'border-amber-200 bg-amber-50/30' : 'opacity-50 grayscale'
                }`}
              >
                <span className="text-3xl leading-none">{badge.emoji}</span>
                <div>
                  <p className={`font-bold text-[13px] ${badge.unlocked ? 'text-[#111827]' : 'text-gray-400'}`}>
                    {t(badge.gr, badge.en)}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">
                    {t(badge.dgr, badge.den)}
                  </p>
                </div>
                {badge.unlocked ? (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    {t('Ξεκλείδωτο ✓', 'Unlocked ✓')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
