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
          {/* Self-explanatory labels: what is hidden and why, in the chip itself. */}
          {showConflicts
            ? t('Κρύψε όσες πέφτουν πάνω σε σχέδιά σου', 'Hide clashes with your plans')
            : t(`Ίδια ώρα με σχέδιά σου (${conflictCount})`, `Same time as your plans (${conflictCount})`)}
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
            ? t('Κρύψε πλήρεις & δικές σου', 'Hide full & yours')
            : t(`Πλήρεις ή ήδη μέσα (${fullJoinedCount})`, `Full or already in (${fullJoinedCount})`)}
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
