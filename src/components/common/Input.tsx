import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Token-driven text input. 40px height satisfies the ≥40px touch-target baseline. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'field-control flex h-9 w-full rounded-2xl border border-border bg-surface-raised px-3.5 py-1.5 text-ink',
        'placeholder:text-ink-faint transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:border-ink',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
