import { useLanguage } from '../../lib/i18n';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { HomeQuickActions } from './HomeQuickActions';
import { ActiveBuddiesRail } from './ActiveBuddiesRail';
import { HomeQuickStatsBar } from './HomeQuickStatsBar';
import { HomeDailyTip } from './HomeDailyTip';
import { HomeSeekingHostSection } from './HomeSeekingHostSection';
import type { Event } from '../../types';

interface HomeBelowFoldProps {
  /** Classic vs themed visual tokens for child blocks. */
  useClassicTokens?: boolean;
  onScrollToCategories?: () => void;
  seekingHostEvents: Event[];
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
  /** Optional themed step-card class overrides. */
  stepCardClass?: string;
  stepCircleClass?: string;
  stepTitleClass?: string;
  stepBodyClass?: string;
}

/**
 * P4 — demoted Home sections (below the event grid).
 * Keeps discovery above-the-fold lean: hero + stories + one buddy entry + filters + grid.
 */
export function HomeBelowFold({
  useClassicTokens = false,
  onScrollToCategories,
  seekingHostEvents,
  seekingHostOnly,
  onToggleSeekingHostOnly,
  stepCardClass,
  stepCircleClass,
  stepTitleClass,
  stepBodyClass,
}: HomeBelowFoldProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 md:space-y-5 pt-4 border-t border-border">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        {t('Περισσότερα', 'More')}
      </p>

      <HomeQuickActions
        useClassicTokens={useClassicTokens}
        onScrollToCategories={onScrollToCategories}
      />
      <ActiveBuddiesRail useClassicTokens={useClassicTokens} />
      <HomeQuickStatsBar />
      <HomeDailyTip />
      <HomeSeekingHostSection
        events={seekingHostEvents}
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={onToggleSeekingHostOnly}
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            step: '1',
            title: t('home.how.step1.title', 'Διαλέξτε μια εμπειρία'),
            body: t(
              'home.how.step1.body',
              'Επιλέξτε μια εκδήλωση, πεζοπορία ή δραστηριότητα που θέλετε να παρακολουθήσετε.',
            ),
          },
          {
            step: '2',
            title: t('home.how.step2.title', 'Εντάξτε μια μικρή ομάδα'),
            body: t(
              'home.how.step2.body',
              'Συνδεθείτε με 3-6 άτομα που μοιράζονται την ίδια πρόθεση και πρόγραμμα.',
            ),
          },
          {
            step: '3',
            title: t('home.how.step3.title', 'Επιβεβαιώστε & συναντηθείτε'),
            body: t(
              'home.how.step3.body',
              'Ξεκλειδώστε το group chat, ορίστε σημείο συνάντησης και απολαύστε την εμπειρία.',
            ),
          },
        ].map(({ step, title, body }) => (
          <div
            key={step}
            className={cn(
              'p-4 rounded-xl border shadow-soft flex flex-col items-center text-center border-border bg-surface-raised',
              stepCardClass,
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2.5 bg-accent-soft text-accent-strong',
                stepCircleClass,
              )}
            >
              {step}
            </div>
            <h3 className={cn(HOME_TYPO.stepTitle, 'mb-1 text-ink', stepTitleClass)}>{title}</h3>
            <p className={cn(HOME_TYPO.stepBody, 'text-ink-muted', stepBodyClass)}>{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
