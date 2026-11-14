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
        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
        active
          ? 'bg-brand text-brand-fg border-transparent'
          : 'bg-surface-raised text-ink-muted border-border hover:border-border-strong hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}
