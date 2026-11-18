import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';

export type HomeFilterOption<T extends string> = {
  value: T;
  label: string;
};

interface HomeFilterSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: HomeFilterOption<T>[];
  ariaLabel: string;
  className?: string;
  /** Leading chevron before the label (sort control). */
  showLeadingChevron?: boolean;
}

/** App-styled filter select — replaces native OS pickers on home meta filters. */
export function HomeFilterSelect<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  showLeadingChevron = false,
}: HomeFilterSelectProps<T>) {
  const h = useHomeTheme();
  const p = usePageContrast();
  const selected = options.find((o) => o.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          HOME_TYPO.filterControlEqual,
          'inline-flex h-[1.75rem] items-center justify-center gap-1.5 rounded-[0.625rem] border px-2 text-xs font-semibold outline-none transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-ink/25',
          h.select,
          className,
        )}
      >
        {showLeadingChevron && (
          <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-70', h.labelMuted)} aria-hidden />
        )}
        <SelectPrimitive.Value placeholder={selected?.label} />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-modal-high overflow-hidden rounded-2xl border p-1.5 shadow-soft-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            p.isDark
              ? 'border-gray-700 bg-gray-900 text-gray-100'
              : 'border-gray-200 bg-white text-gray-900',
          )}
        >
          <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)]">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-xs font-bold outline-none',
                  'data-[highlighted]:bg-accent/10',
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
  );
}
