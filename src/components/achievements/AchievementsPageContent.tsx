import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Calendar, ChevronRight, Flame, Share2, Shield, Star, Target, TrendingUp, Trophy, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { TabBar } from '../common/TabBar';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import { computeUserXp } from '../../lib/gamification';
import type { AchievementId } from '../../lib/achievements';
import { DailyChallengeCard, GamificationHubNav, GamificationSummary, useGamificationData } from './GamificationHub';

const ICONS: Record<AchievementId, { icon: React.ElementType; color: string; darkColor: string }> = {
  first_experience: { icon: Calendar, color: 'text-cyan-600 bg-cyan-100', darkColor: 'text-cyan-400 bg-cyan-900/30' },
  social_butterfly: { icon: Users, color: 'text-purple-600 bg-purple-100', darkColor: 'text-purple-400 bg-purple-900/30' },
  reliability_star: { icon: Star, color: 'text-amber-600 bg-amber-100', darkColor: 'text-amber-400 bg-amber-900/30' },
  weekly_streak: { icon: Flame, color: 'text-orange-600 bg-orange-100', darkColor: 'text-orange-400 bg-orange-900/30' },
  trusted_member: { icon: Shield, color: 'text-green-600 bg-green-100', darkColor: 'text-green-400 bg-green-900/30' },
  explorer: { icon: Target, color: 'text-indigo-600 bg-indigo-100', darkColor: 'text-indigo-400 bg-indigo-900/30' },
  trailblazer: { icon: Trophy, color: 'text-rose-600 bg-rose-100', darkColor: 'text-rose-400 bg-rose-900/30' },
  connector: { icon: UserPlus, color: 'text-teal-600 bg-teal-100', darkColor: 'text-teal-400 bg-teal-900/30' },
};

/**
 * Achievements (Φ25): nakamas hub layout (shared nav + ring summary + daily
 * challenge) on top of parea's live data. Every value is derived from the
 * store — no hardcoded progress, streaks or leaderboard rows.
 */
export default function AchievementsPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'badges' | 'streaks' | 'leaderboard'>('badges');
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const groups = useStore((s) => s.groups);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const d = useGamificationData();

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

  const leaderboard = useMemo(() => {
    return users
      .map((u) => {
        const isMe = u.id === currentUser?.id;
        return {
          id: u.id,
          name: isMe ? t('Εσύ', 'You') : u.name,
          avatar: u.photoUrl || `https://i.pravatar.cc/64?u=${u.id}`,
          xp: isMe ? d.xp : computeUserXp(u, false, Math.floor((u.reliabilityScore ?? 50) / 10)),
          isMe,
        };
      })
      .sort((x, y) => y.xp - x.xp)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [users, currentUser, d.xp, t]);
  const top = leaderboard.slice(0, 5);
  const me = leaderboard.find((e) => e.isMe);
  const rows = me && !top.some((e) => e.isMe) ? [...top, me] : top;

  const groupsJoined = currentUser ? groups.filter((g) => g.members.includes(currentUser.id)).length : 0;
  const dayLabels = [t('Δε', 'Mo'), t('Τρ', 'Tu'), t('Τε', 'We'), t('Πε', 'Th'), t('Πα', 'Fr'), t('Σα', 'Sa'), t('Κυ', 'Su')];
  const activeDays = d.weekly.days.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <GamificationHubNav />
      <div>
        <div>
          <h1 className={cn('text-base md:text-lg font-bold', a.head)}>{t('Επιτεύγματα', 'Achievements')}</h1>
          <p className={cn('font-medium text-sm mt-1', a.sub)}>
            {t('Κάθε badge βασίζεται στη πραγματική σου δραστηριότητα — πάτα ένα για να δεις πώς το ξεκλειδώνεις.', 'Every badge is based on your real activity — tap one to see how to unlock it.')}
          </p>
        </div>
      </div>

      <GamificationSummary />
      <DailyChallengeCard />

      <TabBar
        variant="segmented"
        idBase="achievements"
        ariaLabel={t('Ενότητες επιτευγμάτων', 'Achievement sections')}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        tabs={[
          { id: 'badges', label: t('Διακριτικά', 'Badges'), icon: Award, count: d.unlocked },
          { id: 'streaks', label: t('Σερί', 'Streaks'), icon: Flame },
          { id: 'leaderboard', label: t('Κατάταξη', 'Leaderboard'), icon: Trophy },
        ]}
      />

      <div role="tabpanel" id={`achievements-panel-${activeTab}`} aria-labelledby={`achievements-tab-${activeTab}`}>
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.achievements.map((ach) => {
              const meta = ICONS[ach.id];
              const Icon = meta.icon;
              const pct = Math.min(100, (ach.progress / ach.goal) * 100);
              const title = t(ach.titleEl, ach.titleEn);
              return (
                <Card key={ach.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', a.isDark ? meta.darkColor : meta.color, !ach.unlocked && 'opacity-60')}>
                      <Icon className="w-4 h-4" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className={cn('text-sm font-bold truncate', a.head)}>{title}</h2>
                        {ach.unlocked && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label={t('Ξεκλείδωτο', 'Unlocked')} />}
                      </div>
                      <p className={cn('text-xs font-medium mt-0.5 line-clamp-1', a.sub)}>{t(ach.descriptionEl, ach.descriptionEn)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={cn('flex-1 h-1.5 rounded-full overflow-hidden', a.progressBg)}
                          role="progressbar"
                          aria-label={title}
                          aria-valuemin={0}
                          aria-valuemax={ach.goal}
                          aria-valuenow={ach.progress}
                        >
                          <div className={cn('h-full rounded-full transition-all', ach.unlocked ? a.barFill : a.isDark ? 'bg-gray-500' : 'bg-gray-400')} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={cn('text-2xs font-bold tabular-nums', a.muted)}>
                          {ach.progress}/{ach.goal}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn('text-2xs font-bold px-1.5 py-0.5 rounded-lg', a.xpBadge)}>+{ach.xp} XP</span>
                      {ach.unlocked ? (
                        <button
                          type="button"
                          className={cn('text-xs font-bold flex items-center gap-0.5 transition-colors', a.shareHover)}
                          onClick={() => void handleShareBadge(title)}
                          aria-label={`${t('Κοινοποίηση', 'Share')}: ${title}`}
                        >
                          <Share2 className="w-2.5 h-2.5" aria-hidden />
                          {t('Κοινοπ.', 'Share')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(ach.path)}
                          className={cn('text-xs font-bold flex items-center gap-0.5 transition-colors', a.shareHover)}
                          aria-label={`${t('Πώς το ξεκλειδώνω', 'How to unlock')}: ${title}`}
                        >
                          {t('Ξεκλείδωμα', 'Unlock')} <ChevronRight className="w-2.5 h-2.5" aria-hidden />
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
                <Flame className="w-5 h-5 text-orange-500" aria-hidden />
                <div>
                  <p className={cn('text-lg font-bold tabular-nums', a.head)}>
                    {d.weekly.streak} {d.weekly.streak === 1 ? t('ημέρα σερί', 'day streak') : t('ημέρες σερί', 'day streak')}
                  </p>
                  <p className={cn('text-xs font-medium', a.sub)}>
                    {t('Μετράει κάθε μέρα που στέλνεις μήνυμα, αξιολογείς ή ολοκληρώνεις πρόκληση.', 'Any day you message, review or complete a challenge counts.')}
                  </p>
                </div>
              </div>
              <ol className="flex gap-2 justify-between" aria-label={t('Δραστηριότητα εβδομάδας', 'This week’s activity')}>
                {dayLabels.map((day, i) => (
                  <li key={day} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        d.weekly.days[i] ? 'bg-orange-100 text-orange-600 border-2 border-orange-300' : a.streakOff,
                      )}
                    >
                      {d.weekly.days[i] ? <Flame className="w-3.5 h-3.5" aria-hidden /> : null}
                    </div>
                    <span className={cn('text-2xs font-medium', a.muted)}>
                      {day}
                      <span className="sr-only">{d.weekly.days[i] ? t(' — ενεργή', ' — active') : t(' — ανενεργή', ' — inactive')}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-5">
              <h2 className={cn('text-sm font-bold mb-3', a.head)}>{t('Στατιστικά', 'Stats')}</h2>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  { val: String(activeDays), label: t('Ενεργές μέρες (εβδ.)', 'Active days (week)'), icon: TrendingUp },
                  { val: String(groupsJoined), label: t('Ομάδες', 'Groups'), icon: Users },
                  { val: String(Object.keys(feedbackSubmitted).length), label: t('Αξιολογήσεις', 'Reviews'), icon: Star },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse items-center text-center">
                    <dt className={cn('text-2xs font-medium', a.sub)}>{stat.label}</dt>
                    <dd className={cn('text-lg font-black tabular-nums', a.head)}>{stat.val}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Card className="p-0 overflow-hidden">
            <ol>
              {rows.map((entry) => (
                <li key={entry.id} className={cn('flex items-center gap-3 px-4 py-3 border-b last:border-0', a.lbBorder, entry.isMe && a.highlightRow)}>
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black tabular-nums',
                      entry.rank === 1 ? 'bg-amber-100 text-amber-700' : entry.rank === 2 ? (a.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700') : entry.rank === 3 ? 'bg-orange-100 text-orange-700' : a.isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {entry.rank}
                  </span>
                  <img src={entry.avatar} alt="" referrerPolicy="no-referrer" className={cn('w-7 h-7 rounded-full border', a.isDark ? 'border-gray-700' : 'border-gray-200')} />
                  <span className={cn('flex-1 text-sm font-medium', entry.isMe ? cn('font-bold', a.highlightText) : a.head)}>{entry.name}</span>
                  <span className={cn('text-xs font-bold tabular-nums', a.sub)}>{entry.xp} XP</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => navigate('/leaderboard')}
              className={cn('w-full flex items-center justify-center gap-1 py-2.5 text-xs font-bold border-t transition-colors', a.lbBorder, a.shareHover)}
            >
              {t('Πλήρης κατάταξη', 'Full leaderboard')} <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
