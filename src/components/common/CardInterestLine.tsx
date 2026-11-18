import { useLanguage } from '../../lib/i18n';
import { interestLabel } from '../../lib/interests';
import { cn } from '../../lib/utils';

/**
 * Quiet interest / tag line for cards — one glanceable sentence instead of chip clusters.
 * Keeps every tag available via title when truncated. Known interests are
 * shown in the current language; anything else stays as written.
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
  const { language } = useLanguage();
  if (!items.length) return null;
  const labels = items.map((item) => interestLabel(item, language));
  const shown = labels.slice(0, max);
  const extra = labels.length - shown.length;
  const text = extra > 0 ? `${shown.join(separator)}${separator}+${extra}` : shown.join(separator);

  return (
    <p className={cn('card-meta font-medium line-clamp-1', className)} title={labels.join(separator)}>
      {text}
    </p>
  );
}
