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
}) {
  const { t } = useLanguage();
  if (conflictCount === 0 && fullJoinedCount === 0 && pastCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
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
            ? t('Κρύψε συγκρούσεις', 'Hide conflicts')
            : t(`Συγκρούσεις (${conflictCount})`, `Conflicts (${conflictCount})`)}
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
            ? t('Κρύψε άλλες', 'Hide more')
            : t(`Άλλες (${fullJoinedCount})`, `More (${fullJoinedCount})`)}
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
            : t(`Παλιές (${pastCount})`, `Past (${pastCount})`)}
        </button>
      )}
    </div>
  );
}
