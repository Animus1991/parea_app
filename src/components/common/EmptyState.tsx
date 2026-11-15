import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional quieter second path — never replaces the primary CTA. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/** Token-driven empty state: soft brand icon well, title, optional description + CTA. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-surface-raised',
        className,
      )}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4">
          <Icon className="w-7 h-7" aria-hidden />
        </div>
      )}
      {/* Inside-card type ≤ page title (text-sm); subtitle < title */}
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && (
        <p className="text-xs font-medium text-ink-muted max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      )}
      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button variant="ghost" size="md" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
