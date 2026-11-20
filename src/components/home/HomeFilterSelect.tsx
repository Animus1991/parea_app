import { AppSelect, type AppSelectOption } from '../common/AppSelect';
import { useHomeTheme } from '../../hooks/useHomeTheme';
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

  return (
    <AppSelect
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      options={options as AppSelectOption[]}
      ariaLabel={ariaLabel}
      showLeadingChevron={showLeadingChevron}
      className={cn(
        HOME_TYPO.filterControlEqual,
        'h-[1.75rem] rounded-[0.625rem] border px-2 text-xs font-semibold',
        h.select,
        className,
      )}
    />
  );
}
