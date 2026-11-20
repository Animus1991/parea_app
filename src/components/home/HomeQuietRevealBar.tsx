import { useLanguage } from '../../lib/i18n';
import {
  conflictRevealCopy,
  fullRevealCopy,
  joinedRevealCopy,
  pastRevealCopy,
  type QuietRevealCopy,
} from '../../lib/quietRevealCopy';
import { cn } from '../../lib/utils';

const CHIP =
  'filter-chip inline-flex h-[1.75rem] items-center rounded-full border px-3 text-xs font-bold leading-none whitespace-nowrap';

function RevealChip({
  show,
  onToggle,
  copy,
}: {
  show: boolean;
  onToggle: () => void;
  copy: QuietRevealCopy;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      aria-pressed={show}
      title={t(...copy.title)}
      onClick={onToggle}
      className={cn(
        CHIP,
        show ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-raised text-ink',
      )}
    >
      {t(...copy.label)}
    </button>
  );
}

export function HomeQuietRevealBar({
  conflictCount,
  showConflicts,
  onToggleConflicts,
  fullCount,
  showFull,
  onToggleFull,
  joinedCount,
  showJoined,
  onToggleJoined,
  pastCount,
  showPast,
  onTogglePast,
}: {
  conflictCount: number;
  showConflicts: boolean;
  onToggleConflicts: () => void;
  fullCount: number;
  showFull: boolean;
  onToggleFull: () => void;
  joinedCount: number;
  showJoined: boolean;
  onToggleJoined: () => void;
  pastCount: number;
  showPast: boolean;
  onTogglePast: () => void;
}) {
  if (conflictCount === 0 && fullCount === 0 && joinedCount === 0 && pastCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {conflictCount > 0 && (
        <RevealChip
          show={showConflicts}
          onToggle={onToggleConflicts}
          copy={conflictRevealCopy(showConflicts, conflictCount)}
        />
      )}
      {fullCount > 0 && (
        <RevealChip
          show={showFull}
          onToggle={onToggleFull}
          copy={fullRevealCopy(showFull, fullCount)}
        />
      )}
      {joinedCount > 0 && (
        <RevealChip
          show={showJoined}
          onToggle={onToggleJoined}
          copy={joinedRevealCopy(showJoined, joinedCount)}
        />
      )}
      {pastCount > 0 && (
        <RevealChip
          show={showPast}
          onToggle={onTogglePast}
          copy={pastRevealCopy(showPast, pastCount)}
        />
      )}
    </div>
  );
}
