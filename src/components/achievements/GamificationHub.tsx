import { NavLink, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Flame, MessageSquare, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { useStore } from '../../store';
import { DAILY_CHALLENGE_XP } from '../../lib/achievements';
import { useGamificationData } from '../../hooks/useGamificationData';

/** Segmented navigation shared by /achievements, /challenges and /leaderboard (port from nakamas hub). */
export function GamificationHubNav({ className }: { className?: string }) {
  const { t } = useLanguage();
  const items = [
    { to: '/achievements', icon: Award, label: t('Επιτεύγματα', 'Badges') },
    { to: '/challenges', icon: Zap, label: t('Προκλήσεις', 'Challenges') },
    { to: '/leaderboard', icon: Trophy, label: t('Κατάταξη', 'Ranking') },
  ];
  return (
    <nav aria-label={t('Πρόοδος & ανταμοιβές', 'Progress & rewards')} className={cn('inline-flex max-w-full gap-1 overflow-x-auto noscrollbar rounded-xl border border-border bg-surface-raised p-1', className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              isActive ? 'bg-accent text-accent-fg shadow-soft' : 'text-ink-muted hover:bg-surface hover:text-ink',
            )
          }
        >
          <item.icon className="h-3.5 w-3.5" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Ring-gauge level + compact live stats strip (nakamas design, parea data). */
export function GamificationSummary({ className }: { className?: string }) {
  const { t } = useLanguage();
  const d = useGamificationData();
  const circumference = 2 * Math.PI * 28;
  return (
    <section
      aria-label={t('Η πρόοδός σου', 'Your progress')}
      className={cn('flex flex-col gap-5 rounded-2xl border border-border bg-surface-raised p-5 shadow-soft md:flex-row md:items-center md:justify-between', className)}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" className="stroke-border" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-accent transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * d.levelProgress) / 100}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(APP_TYPO.statValue, 'text-ink')}>{d.level.level}</span>
            <span className="text-2xs font-semibold text-ink-muted">LVL</span>
          </div>
        </div>
        <div>
          <p className={cn('flex flex-wrap items-center gap-2 text-ink', APP_TYPO.panelTitle)}>
            {t('Επίπεδο', 'Level')} {d.level.level} · {t(d.level.titleEl, d.level.titleEn)}
            <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-bold text-ink tabular-nums">{d.xp} XP</span>
          </p>
          <p className="mt-1 text-xs text-ink-muted tabular-nums">
            {d.level.nextAt - d.xp} XP {t('μέχρι το επόμενο επίπεδο', 'to the next level')}
          </p>
        </div>
      </div>
      <dl className="grid w-full grid-cols-3 gap-2 md:w-auto">
        {[
          { label: t('Ξεκλείδωτα', 'Unlocked'), value: `${d.unlocked}/${d.achievements.length}` },
          { label: t('Σερί ημερών', 'Day streak'), value: `${d.weekly.streak}` },
          { label: t('Θέση', 'Rank'), value: `#${d.rank}` },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
            <dt className={cn(APP_TYPO.sectionLabel, 'text-ink-muted')}>{stat.label}</dt>
            <dd className={cn('block text-ink', APP_TYPO.statValue)}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Daily challenge with honest completion: the claim button unlocks only after
 * the user really sent a group message today, and XP is awarded once per day.
 */
export function DailyChallengeCard({ className }: { className?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const d = useGamificationData();
  const claim = useStore((s) => s.claimDailyChallenge);
  const onClaim = () => {
    if (claim(DAILY_CHALLENGE_XP)) {
      toast.success(t(`+${DAILY_CHALLENGE_XP} XP — ημερήσια πρόκληση`, `+${DAILY_CHALLENGE_XP} XP — daily challenge`), {
        action: {
          label: t('Επιτεύγματα', 'Achievements'),
          onClick: () => navigate('/achievements'),
        },
      });
    }
  };
  return (
    <section
      aria-label={t('Ημερήσια πρόκληση', 'Daily challenge')}
      className={cn('flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex items-center gap-3.5">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-accent">
            {t('Ημερήσια πρόκληση', 'Daily challenge')} <span className="text-ink-muted">· +{DAILY_CHALLENGE_XP} XP</span>
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{t('Στείλε μήνυμα σε μια ομάδα σήμερα', 'Send a message in a group today')}</p>
          {!d.dailyClaimed && (
            <p id="daily-challenge-hint" className="mt-0.5 text-xs text-ink-muted">
              {d.dailyMet ? t('Έτοιμο! Πάρε την ανταμοιβή σου.', 'Done! Claim your reward.') : t('Η ανταμοιβή ξεκλειδώνει μόλις στείλεις ένα μήνυμα.', 'The reward unlocks once you send a message.')}
            </p>
          )}
        </div>
      </div>
      {d.dailyClaimed ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {t('Ολοκληρώθηκε σήμερα', 'Completed today')}
        </span>
      ) : (
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/chats')}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-initial"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {t('Στις συνομιλίες', 'Go to chats')}
          </button>
          <button
            type="button"
            onClick={onClaim}
            disabled={!d.dailyMet}
            aria-describedby="daily-challenge-hint"
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:flex-initial"
          >
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {t('Πάρε +30 XP', 'Claim +30 XP')}
          </button>
        </div>
      )}
    </section>
  );
}
