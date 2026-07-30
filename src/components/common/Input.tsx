import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Token-driven text input. 40px height satisfies the ≥40px touch-target baseline. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-ink',
        'placeholder:text-ink-faint transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:border-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
