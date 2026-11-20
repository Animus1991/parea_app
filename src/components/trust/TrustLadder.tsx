import { cn } from '../../lib/utils';

export type TrustLadderItem = {
  title: string;
  body: string;
  state: 'done' | 'current' | 'upcoming';
  badge?: string;
};

/**
 * Quiet connected path — names and captions, no outline numbers.
 * Used for trust tiers and standing steps.
 */
export function TrustLadder({
  items,
  className,
}: {
  items: TrustLadderItem[];
  className?: string;
}) {
  return (
    <ol className={cn('list-none', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={item.title} className="relative flex gap-3">
            {!last && (
              <span className="absolute left-[3px] top-[13px] bottom-0 w-px bg-border" aria-hidden />
            )}
            <span
              aria-hidden
              className={cn(
                'relative z-[1] mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                item.state === 'current' && 'bg-ink',
                item.state === 'done' && 'bg-ink/40',
                item.state === 'upcoming' && 'border border-border bg-surface-raised',
              )}
            />
            <div className={cn('min-w-0 flex-1', !last && 'pb-3')}>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <p className="text-xs font-semibold text-ink">{item.title}</p>
                {item.badge && (
                  <span className="text-2xs font-semibold text-ink-muted">{item.badge}</span>
                )}
              </div>
              <p className="text-xs font-medium leading-snug text-ink-muted">{item.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
