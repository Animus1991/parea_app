import { cn } from '../../lib/utils';

/**
 * Quiet interest / tag line for cards — one glanceable sentence instead of chip clusters.
 * Keeps every tag available via title when truncated.
 */
export function CardInterestLine({
  items,
  max = 3,
  className,
  separator = ' · ',
}: {
  items: string[];
  max?: number;
  className?: string;
  separator?: string;
}) {
  if (!items.length) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  const text = extra > 0 ? `${shown.join(separator)}${separator}+${extra}` : shown.join(separator);

  return (
    <p className={cn('card-meta font-medium line-clamp-1', className)} title={items.join(separator)}>
      {text}
    </p>
  );
}
