import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';

/** Radix forbids empty item values; map "" to this sentinel. */
const EMPTY_VALUE = '__nakamas-empty__';

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  ariaLabel: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  showLeadingChevron?: boolean;
  hideTrailingChevron?: boolean;
}

function toRadixValue(value: string): string {
  return value === '' ? EMPTY_VALUE : value;
}

function fromRadixValue(value: string): string {
  return value === EMPTY_VALUE ? '' : value;
}

/**
 * Platform select — same Nakamas card menu everywhere, instead of the
 * native Google/Android radio list.
 */
export function AppSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  id,
  name,
  required,
  disabled,
  placeholder,
  className,
  contentClassName,
  showLeadingChevron = false,
  hideTrailingChevron = false,
}: AppSelectProps) {
  const p = usePageContrast();
  const selected = options.find((opt) => opt.value === value);
  const display = selected?.label || placeholder || '';
  const radixValue = toRadixValue(value);
  const radixOptions = options.map((opt) => ({
    ...opt,
    radix: toRadixValue(opt.value),
  }));

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <SelectPrimitive.Root
        value={radixValue}
        onValueChange={(next) => onValueChange(fromRadixValue(next))}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          className={cn(
            'inline-flex items-center justify-between gap-2 text-left outline-none',
            'focus-visible:ring-2 focus-visible:ring-accent/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          {showLeadingChevron && (
            <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
          )}
          <SelectPrimitive.Value placeholder={placeholder}>
            <span className="min-w-0 truncate">{display}</span>
          </SelectPrimitive.Value>
          {!hideTrailingChevron && (
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
            </SelectPrimitive.Icon>
          )}
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              'z-modal-high overflow-hidden rounded-2xl border p-1.5 shadow-soft-lg',
              'max-h-[min(22rem,var(--radix-select-content-available-height))]',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
              p.isDark
                ? 'border-gray-700 bg-gray-900 text-gray-100'
                : 'border-gray-200 bg-white text-gray-900',
              contentClassName,
            )}
          >
            <SelectPrimitive.Viewport className="w-full max-h-[20rem] overflow-y-auto overscroll-contain min-w-[var(--radix-select-trigger-width)]">
              {radixOptions.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.radix}
                  value={opt.radix}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-xs font-bold outline-none',
                    'data-[highlighted]:bg-accent/10',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
                    p.isDark
                      ? 'data-[state=checked]:bg-white/10 data-[state=checked]:text-white'
                      : 'data-[state=checked]:bg-accent-soft data-[state=checked]:text-accent',
                  )}
                >
                  <span className="absolute right-2.5 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}
