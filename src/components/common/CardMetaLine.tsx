import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Single quiet meta row for cards (date · place · spots). Prefer over chip rows.
 */
export function CardMetaLine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('card-meta font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5', className)}>
      {children}
    </p>
  );
}

export function CardMetaDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('opacity-40', className)}>·</span>;
}
