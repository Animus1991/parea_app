import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const tok = useThemeStyles();
  const c = useContrastTheme();
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center',
        c.border,
        tok.isDark ? 'bg-gray-800/30' : 'bg-gray-50/80',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          tok.accentBg,
        )}
      >
        <Icon className={cn('h-7 w-7', tok.accentText)} aria-hidden />
      </div>
      <h3 className={cn('text-base font-bold', tok.head)}>{title}</h3>
      {description && (
        <p className={cn('mt-2 max-w-sm text-sm font-medium', tok.sub)}>{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" className="mt-5 min-h-11" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
