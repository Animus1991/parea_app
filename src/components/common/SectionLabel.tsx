import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';

interface SectionLabelProps {
  /** Greek copy — title case (first letter of each word). */
  el?: string;
  en?: string;
  children?: ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'p' | 'span';
}

/**
 * Token-driven section eyebrow. Pass el/en for automatic i18n + title case,
 * or children for custom content.
 */
export function SectionLabel({ el, en, children, className, as: Tag = 'h2' }: SectionLabelProps) {
  const { tu } = useLanguage();
  return (
    <Tag className={cn('text-xs font-semibold tracking-wide text-ink-muted', className)}>
      {el ? tu(el, en) : children}
    </Tag>
  );
}
