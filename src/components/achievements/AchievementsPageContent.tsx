import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ChevronRight, Flame, Share2, Star, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { TabBar } from '../common/TabBar';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import { DailyChallengeCard, GamificationHubNav, GamificationSummary } from './GamificationHub';
import { useGamificationData } from '../../hooks/useGamificationData';
import { NakamasMini } from '../illustrations/NakamasMini';
import { ACHIEVEMENT_MINI } from '../illustrations/miniMaps';

/**
 * Achievements (Φ25): nakamas hub layout (shared nav + ring summary + daily
 * challenge) on top of parea's live data. Every value is derived from the
 * store — no hardcoded progress, streaks or leaderboard rows.
 */
export default function AchievementsPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'badges' | 'streaks'>('badges');
  const currentUser = useStore((s) => s.currentUser);
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

  const groupsJoined = currentUser ? groups.filter((g) => g.members.includes(currentUser.id)).length : 0;
  const dayLabels = [t('Δε', 'Mo'), t('Τρ', 'Tu'), t('Τε', 'We'), t('Πε', 'Th'), t('Πα', 'Fr'), t('Σα', 'Sa'), t('Κυ', 'Su')];
  const activeDays = d.weekly.days.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <GamificationHubNav />
      <div>
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Επιτεύγματα', 'Achievements')}</h1>
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
        ]}
      />
      <button
        type="button"
        onClick={() => navigate('/leaderboard')}
        className={cn('inline-flex min-h-9 items-center gap-1 text-xs font-semibold', a.link)}
      >
        {t('Δες την κατάταξη →', 'See the leaderboard →')}
      </button>

      <div role="tabpanel" id={`achievements-panel-${activeTab}`} aria-labelledby={`achievements-tab-${activeTab}`}>
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.achievements.map((ach) => {
              const pct = Math.min(100, (ach.progress / ach.goal) * 100);
              const title = t(ach.titleEl, ach.titleEn);
              return (
                <Card key={ach.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('shrink-0', !ach.unlocked && 'opacity-55 grayscale')}>
                      <NakamasMini id={ACHIEVEMENT_MINI[ach.id]} size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className={cn('text-sm font-bold truncate', a.head)}>{title}</h2>
                        {ach.unlocked && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label={t('Ξεκλείδωτο', 'Unlocked')} />}
                      </div>
                      <p className={cn('text-xs font-medium mt-0.5', a.sub)}>{t(ach.descriptionEl, ach.descriptionEn)}</p>
                      <div className="flex items-center gap-2 mt-2.5">
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
                      <span className={cn('card-meta font-bold tabular-nums', a.isDark ? 'text-amber-300' : 'text-amber-700')}>+{ach.xp} XP</span>
                      {ach.unlocked ? (
                        <button
                          type="button"
                          className={cn('min-h-9 text-xs font-bold flex items-center gap-1 transition-colors', a.shareHover)}
                          onClick={() => void handleShareBadge(title)}
                          aria-label={`${t('Κοινοποίηση', 'Share')}: ${title}`}
                        >
                          <Share2 className="w-3 h-3" aria-hidden />
                          {t('Κοινοπ.', 'Share')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(ach.path)}
                          className={cn('min-h-9 text-xs font-bold flex items-center gap-0.5 transition-colors', a.shareHover)}
                          aria-label={`${t('Πώς το ξεκλειδώνω', 'How to unlock')}: ${title}`}
                        >
                          {t('Ξεκλείδωμα', 'Unlock')} <ChevronRight className="w-3 h-3" aria-hidden />
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
                  <p className={cn(APP_TYPO.statValue, a.head)}>
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
                        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold',
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
                    <dt className={cn(APP_TYPO.sectionLabel, a.sub)}>{stat.label}</dt>
                    <dd className={cn('text-sm md:text-base font-bold tabular-nums', a.head)}>{stat.val}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
