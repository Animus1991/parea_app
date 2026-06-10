import { useLanguage } from '../../lib/i18n';
import { explainEventMatch } from '../../lib/matchingExplain';
import type { Event, User } from '../../types';
import { cn } from '../../lib/utils';

interface MatchExplainChipsProps {
  user: User;
  event: Event;
  className?: string;
  max?: number;
}

export function MatchExplainChips({ user, event, className, max = 3 }: MatchExplainChipsProps) {
  const { language } = useLanguage();
  const explanation = explainEventMatch(user, event, language);
  const chips = [
    `${explanation.score}%`,
    ...explanation.sharedStrengths.slice(0, max - 1),
  ].slice(0, max);

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {chips.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums',
            i === 0
              ? 'bg-cyan-600/10 text-cyan-700 dark:text-cyan-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
          )}
          title={explanation.mismatchFlags.join(' · ') || undefined}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
