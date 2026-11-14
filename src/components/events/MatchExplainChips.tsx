import { useLanguage } from '../../lib/i18n';
import { explainEventMatch } from '../../lib/matchingExplain';
import type { Event, User } from '../../types';
import { cn } from '../../lib/utils';

interface MatchExplainChipsProps {
  user: User;
  event: Event;
  className?: string;
  max?: number;
  /**
   * The match % is already shown next to the card title, so cards pass false
   * and get only the reasons, as one quiet line instead of chips.
   */
  showScore?: boolean;
}

export function MatchExplainChips({ user, event, className, max = 3, showScore = true }: MatchExplainChipsProps) {
  const { language } = useLanguage();
  const explanation = explainEventMatch(user, event, language);
  const title = explanation.mismatchFlags.join(' · ') || undefined;

  if (!showScore) {
    const reasons = explanation.sharedStrengths.slice(0, max - 1);
    if (reasons.length === 0) return null;
    return (
      <p className={cn('text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2', className)} title={title}>
        {reasons.join(' · ')}
      </p>
    );
  }

  const chips = [`${explanation.score}%`, ...explanation.sharedStrengths.slice(0, max - 1)].slice(0, max);
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {chips.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tabular-nums',
            i === 0
              ? 'bg-cyan-600/8 text-cyan-800 dark:text-cyan-300'
              : 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300',
          )}
          title={title}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
