import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Token-driven filter/tag chip. Active = brand fill; inactive = neutral outline. */
export function Chip({ active = false, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'filter-chip px-3 rounded-full text-xs font-semibold border transition-colors',
        active
          ? 'bg-ink text-surface-raised border-ink'
          : 'bg-transparent text-ink-muted border-border hover:border-border-strong hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}
