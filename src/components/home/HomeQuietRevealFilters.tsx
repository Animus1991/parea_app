import { useId } from 'react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import {
  QUIET_REVEAL_SECTION,
  conflictFilterCopy,
  fullFilterCopy,
  hasQuietRevealOptions,
  joinedFilterCopy,
  pastFilterCopy,
  type QuietRevealCopy,
  type QuietRevealFilterState,
} from '../../lib/quietRevealCopy';
import { cn } from '../../lib/utils';

function QuietRevealRow({
  checked,
  onToggle,
  copy,
  count,
}: {
  checked: boolean;
  onToggle: () => void;
  copy: QuietRevealCopy;
  count: number;
}) {
  const { t } = useLanguage();
  return (
    <label
      className="flex min-h-10 cursor-pointer items-start gap-2.5"
      title={t(...copy.title)}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        checked={checked}
        onChange={onToggle}
      />
      <span className="text-sm font-medium leading-snug text-ink">
        {t(...copy.label)}
        <span className="font-semibold text-ink-muted"> · {count}</span>
      </span>
    </label>
  );
}

export function HomeQuietRevealFilters(props: QuietRevealFilterState) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const headingId = useId();

  if (!hasQuietRevealOptions(props)) return null;

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-testid="home-quiet-reveal-filters"
      className="space-y-2 rounded-2xl border border-border/70 bg-surface-raised/50 p-3"
    >
      <p id={headingId} className={cn('text-xs font-bold', h.labelMuted)}>
        {t(...QUIET_REVEAL_SECTION.heading)}
      </p>
      <p className="text-2xs font-medium leading-snug text-ink-muted">
        {t(...QUIET_REVEAL_SECTION.hint)}
      </p>
      <div className="space-y-1">
        {props.conflictCount > 0 && (
          <QuietRevealRow
            checked={props.showConflicts}
            onToggle={props.onToggleConflicts}
            copy={conflictFilterCopy()}
            count={props.conflictCount}
          />
        )}
        {props.joinedCount > 0 && (
          <QuietRevealRow
            checked={props.showJoined}
            onToggle={props.onToggleJoined}
            copy={joinedFilterCopy()}
            count={props.joinedCount}
          />
        )}
        {props.fullCount > 0 && (
          <QuietRevealRow
            checked={props.showFull}
            onToggle={props.onToggleFull}
            copy={fullFilterCopy()}
            count={props.fullCount}
          />
        )}
        {props.pastCount > 0 && (
          <QuietRevealRow
            checked={props.showPast}
            onToggle={props.onTogglePast}
            copy={pastFilterCopy()}
            count={props.pastCount}
          />
        )}
      </div>
    </div>
  );
}
