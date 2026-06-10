import React, { useState } from 'react';
import { Trophy, Star, Flame, Users, Calendar, Shield, Target, Zap, Award, TrendingUp, Share2, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import { computeUserXp, levelForXp } from '../../lib/gamification';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  xp: number;
  color: string;
  darkColor: string;
}

export default function AchievementsPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const [activeTab, setActiveTab] = useState<'badges' | 'streaks' | 'leaderboard'>('badges');
  const currentUser = useStore((s) => s.currentUser);
  const bonusXp = useStore((s) => s.bonusXp);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const awardXp = useStore((s) => s.awardXp);
  const feedbackCount = Object.keys(feedbackSubmitted).length;

  const totalXP = currentUser
    ? computeUserXp(currentUser, true, feedbackCount, bonusXp)
    : 0;
  const { level, titleEl, titleEn, nextAt } = levelForXp(totalXP);
  const levelProgress = ((totalXP % 200) / 200) * 100;

  const handleShareBadge = async (title: string) => {
    const text = t(`Ξεκλείδωσα το badge «${title}» στο Nakamas!`, `I unlocked the "${title}" badge on Nakamas!`);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Nakamas', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success(t('Αντιγράφηκε στο πρόχειρο', 'Copied to clipboard'));
      }
    } catch {
      toast.info(t('Η κοινοποίηση ακυρώθηκε', 'Share cancelled'));
    }
  };

  const handleDailyChallenge = () => {
    awardXp(30, 'Ημερήσια πρόκληση', 'Daily challenge');
    toast.success(t('+30 XP — ημερήσια πρόκληση', '+30 XP — daily challenge'));
  };

  const achievements: Achievement[] = [
    { id: 'a1', icon: Calendar, title: t('Πρώτη Εμπειρία', 'First Experience'), description: t('Συμμετείχατε στην πρώτη σας εκδήλωση', 'Attended your first event'), progress: 1, maxProgress: 1, unlocked: true, xp: 50, color: 'text-cyan-600 bg-cyan-100', darkColor: 'text-cyan-400 bg-cyan-900/30' },
    { id: 'a2', icon: Users, title: t('Κοινωνική Πεταλούδα', 'Social Butterfly'), description: t('Γίνετε μέλος σε 5 ομάδες', 'Join 5 different groups'), progress: 5, maxProgress: 5, unlocked: true, xp: 100, color: 'text-purple-600 bg-purple-100', darkColor: 'text-purple-400 bg-purple-900/30' },
    { id: 'a3', icon: Star, title: t('Αστέρι Αξιοπιστίας', 'Reliability Star'), description: t('Διατηρήστε 95%+ αξιοπιστία', 'Maintain 95%+ reliability'), progress: 98, maxProgress: 95, unlocked: true, xp: 200, color: 'text-amber-600 bg-amber-100', darkColor: 'text-amber-400 bg-amber-900/30' },
    { id: 'a4', icon: Flame, title: t('Εβδομαδιαίο Σερί', 'Weekly Streak'), description: t('4 εβδομάδες σερί', '4 weeks in a row'), progress: 3, maxProgress: 4, unlocked: false, xp: 150, color: 'text-orange-600 bg-orange-100', darkColor: 'text-orange-400 bg-orange-900/30' },
    { id: 'a5', icon: Shield, title: t('Αξιόπιστο Μέλος', 'Trusted Member'), description: t('Επαληθεύστε ταυτότητα + τηλέφωνο + email', 'Verify ID + phone + email'), progress: 2, maxProgress: 3, unlocked: false, xp: 75, color: 'text-green-600 bg-green-100', darkColor: 'text-green-400 bg-green-900/30' },
    { id: 'a6', icon: Target, title: t('Εξερευνητής', 'Explorer'), description: t('4 διαφορετικές κατηγορίες', '4 different categories'), progress: 3, maxProgress: 4, unlocked: false, xp: 120, color: 'text-indigo-600 bg-indigo-100', darkColor: 'text-indigo-400 bg-indigo-900/30' },
    { id: 'a7', icon: Trophy, title: t('Πρωτοπόρος', 'Trailblazer'), description: t('Ομάδα που γέμισε', 'Created a full group'), progress: 1, maxProgress: 1, unlocked: true, xp: 100, color: 'text-rose-600 bg-rose-100', darkColor: 'text-rose-400 bg-rose-900/30' },
    { id: 'a8', icon: Zap, title: t('Αστραπή', 'Lightning'), description: t('Εγγραφή σε 1 λεπτό', 'Join within 1 minute'), progress: 0, maxProgress: 1, unlocked: false, xp: 80, color: 'text-yellow-600 bg-yellow-100', darkColor: 'text-yellow-400 bg-yellow-900/30' },
  ];

  const streakDays = [true, true, true, false, false, false, false];

  const leaderboard = [
    { rank: 1, name: 'Elena M.', xp: 1250, avatar: 'https://i.pravatar.cc/32?u=lb1' },
    { rank: 2, name: 'Dimitris K.', xp: 980, avatar: 'https://i.pravatar.cc/32?u=lb2' },
    { rank: 3, name: 'Sofia A.', xp: 870, avatar: 'https://i.pravatar.cc/32?u=lb3' },
    { rank: 4, name: t('Εσείς', 'You'), xp: totalXP, avatar: 'https://i.pravatar.cc/32?u=me' },
    { rank: 5, name: 'Kostas R.', xp: 420, avatar: 'https://i.pravatar.cc/32?u=lb5' },
  ];

  return (
    <div className="mx-auto max-w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Επιτεύγματα', 'Achievements')}</h1>
        <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Κερδίστε badges και XP μέσα από συμμετοχές', 'Earn badges and XP through participation')}</p>
      </div>

      {/* Level progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-lg", a.gradientFrom, a.gradientTo)}>
              {level}
            </div>
            <div>
              <p className={cn("text-lg font-bold", a.head)}>{t('Επίπεδο', 'Level')} {level} — {t(titleEl, titleEn)}</p>
              <p className={cn("text-xs font-medium", a.sub)}>{totalXP} XP {t('συνολικά', 'total')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-xs font-bold tracking-wide", a.muted)}>{t('Επόμενο', 'Next level')}</p>
            <p className={cn("text-sm font-bold", a.head)}>{nextAt - totalXP} XP</p>
          </div>
        </div>
        <div className={cn("w-full h-2 rounded-full overflow-hidden", a.progressBg)}>
          <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", a.gradientFrom, a.gradientTo)} style={{ width: `${levelProgress}%` }} />
        </div>
      </Card>

      {/* Daily Challenge */}
      <Card className={cn("p-4 border cursor-pointer", a.challengeBg)} onClick={handleDailyChallenge} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleDailyChallenge()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shadow-soft", a.isDark ? "bg-gray-800/60" : "bg-white")}>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className={cn("text-sm font-bold", a.head)}>{t('Ημερήσια Πρόκληση', 'Daily Challenge')}</p>
              <p className={cn("text-xs font-medium", a.sub)}>{t('Στείλε μήνυμα σε μια ομάδα', 'Send a message in a group')}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn("text-xs font-black", a.xpBadge, "px-1.5 py-0.5 rounded")}>+30 XP</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={cn("flex gap-4 border-b", a.borderB)}>
        {[
          { key: 'badges' as const, label: t('Badges', 'Badges') },
          { key: 'streaks' as const, label: t('Σερί', 'Streaks') },
          { key: 'leaderboard' as const, label: t('Κατάταξη', 'Leaderboard') },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn("pb-3 text-sm font-bold tracking-wide transition-colors whitespace-nowrap", activeTab === tab.key ? cn("border-b-2", a.tabActive) : a.tabInactive)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map(ach => {
            const Icon = ach.icon;
            const pct = Math.min(100, (ach.progress / ach.maxProgress) * 100);
            return (
              <Card key={ach.id} className={cn("p-4 transition-all", !ach.unlocked && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", a.isDark ? ach.darkColor : ach.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("text-sm font-bold truncate", a.head)}>{ach.title}</h4>
                      {ach.unlocked && <Award className="w-3 h-3 text-amber-500 shrink-0" />}
                    </div>
                    <p className={cn("text-xs font-medium mt-0.5 line-clamp-1", a.sub)}>{ach.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", a.progressBg)}>
                        <div className={cn("h-full rounded-full transition-all", ach.unlocked ? a.barFill : (a.isDark ? 'bg-gray-600' : 'bg-gray-300'))} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={cn("text-[10.5px] font-bold", a.muted)}>{ach.progress}/{ach.maxProgress}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn("text-[10.5px] font-bold px-1.5 py-0.5 rounded", a.xpBadge)}>+{ach.xp}XP</span>
                    {ach.unlocked && (
                      <button
                        type="button"
                        className={cn("text-xs font-bold flex items-center gap-0.5 transition-colors", a.shareHover)}
                        onClick={() => handleShareBadge(ach.title)}
                        aria-label={t('Κοινοποίηση badge', 'Share badge')}
                      >
                        <Share2 className="w-2.5 h-2.5" />{t('Κοινοπ.', 'Share')}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className={cn("text-lg font-bold", a.head)}>3 {t('ημέρες σερί', 'day streak')}</p>
                <p className={cn("text-xs font-medium", a.sub)}>{t('Συνεχίστε!', 'Keep going!')}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-between">
              {[t('Δε', 'Mo'), t('Τρ', 'Tu'), t('Τε', 'We'), t('Πε', 'Th'), t('Πα', 'Fr'), t('Σα', 'Sa'), t('Κυ', 'Su')].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", streakDays[i] ? 'bg-orange-100 text-orange-600 border-2 border-orange-300' : a.streakOff)}>
                    {streakDays[i] ? <Flame className="w-3.5 h-3.5" /> : ''}
                  </div>
                  <span className={cn("text-[10.5px] font-medium", a.muted)}>{day}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className={cn("text-sm font-bold mb-3", a.head)}>{t('Στατιστικά Σερί', 'Streak Stats')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: '3', label: t('Τρέχον', 'Current') },
                { val: '7', label: t('Μέγιστο', 'Longest') },
                { val: '12', label: t('Εκδηλώσεις', 'Events') },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className={cn("text-xl font-black", a.head)}>{stat.val}</p>
                  <p className={cn("text-[10.5px] font-medium", a.sub)}>{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Card className="p-0 overflow-hidden">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className={cn("flex items-center gap-3 px-4 py-3 border-b last:border-0", a.lbBorder, entry.rank === 4 && a.highlightRow)}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
                entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                entry.rank === 2 ? (a.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700') :
                entry.rank === 3 ? 'bg-orange-100 text-orange-700' : (a.isDark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-100 text-gray-500')
              )}>
                {entry.rank}
              </span>
              <img src={entry.avatar} alt="" className={cn("w-7 h-7 rounded-full border", a.isDark ? "border-gray-700" : "border-gray-200")} />
              <span className={cn("flex-1 text-sm font-medium", entry.rank === 4 ? cn("font-bold", a.highlightText) : a.head)}>{entry.name}</span>
              <span className={cn("text-xs font-bold", a.sub)}>{entry.xp} XP</span>
              {entry.rank <= 3 && <Trophy className={cn("w-3.5 h-3.5", entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-gray-400' : 'text-orange-400')} />}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
