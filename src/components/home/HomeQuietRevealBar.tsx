import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

const CHIP =
  'filter-chip inline-flex h-[1.75rem] items-center rounded-full border px-3 text-xs font-bold leading-none whitespace-nowrap';

export function HomeQuietRevealBar({
  conflictCount,
  showConflicts,
  onToggleConflicts,
  fullJoinedCount,
  showFullJoined,
  onToggleFullJoined,
  pastCount,
  showPast,
  onTogglePast,
  usualHoursHint,
}: {
  conflictCount: number;
  showConflicts: boolean;
  onToggleConflicts: () => void;
  fullJoinedCount: number;
  showFullJoined: boolean;
  onToggleFullJoined: () => void;
  pastCount: number;
  showPast: boolean;
  onTogglePast: () => void;
  usualHoursHint?: boolean;
}) {
  const { t } = useLanguage();
  if (!usualHoursHint && conflictCount === 0 && fullJoinedCount === 0 && pastCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      {usualHoursHint ? (
        <p className="text-xs font-medium leading-snug text-ink-muted">
          {t(
            'Στις συνήθεις ώρες σου · χωρίς να κρύψουμε τις άλλες.',
            'Usual hours first · the rest stay visible.',
          )}
        </p>
      ) : null}
      {(conflictCount > 0 || fullJoinedCount > 0 || pastCount > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {conflictCount > 0 && (
            <button
              type="button"
              aria-pressed={showConflicts}
              onClick={onToggleConflicts}
              className={cn(
                CHIP,
                showConflicts
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border bg-surface-raised text-ink',
              )}
            >
              {showConflicts
                ? t('Κρύψε συγκρούσεις', 'Hide clashes')
                : t(`Δείξε και όσες συγκρούονται ${conflictCount}`, `Show clashes too ${conflictCount}`)}
            </button>
          )}
          {fullJoinedCount > 0 && (
            <button
              type="button"
              aria-pressed={showFullJoined}
              onClick={onToggleFullJoined}
              className={cn(
                CHIP,
                showFullJoined
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border bg-surface-raised text-ink',
              )}
            >
              {showFullJoined
                ? t('Κρύψε γεμάτα / εγγεγραμμένα', 'Hide full / joined')
                : t(
                    `Δείξε ήδη γεμάτα / ήδη εγγεγραμμένος ${fullJoinedCount}`,
                    `Show full / already joined ${fullJoinedCount}`,
                  )}
            </button>
          )}
          {pastCount > 0 && (
            <button
              type="button"
              aria-pressed={showPast}
              onClick={onTogglePast}
              className={cn(
                CHIP,
                showPast
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border bg-surface-raised text-ink',
              )}
            >
              {showPast
                ? t('Κρύψε παλιές', 'Hide past')
                : t(`Δείξε παλιές ${pastCount}`, `Show past ${pastCount}`)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
