import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { cn } from '../../lib/utils';

interface GroupProgressBarProps {
  current: number;
  target: number;
  showLabel?: boolean;
  className?: string;
  /** Light type/track for a photo overlay. */
  onPhoto?: boolean;
}

export function GroupProgressBar({
  current,
  target,
  showLabel = true,
  className,
  onPhoto = false,
}: GroupProgressBarProps) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={cn('text-xs font-bold tracking-tight', onPhoto ? 'text-white' : tok.muted)}>
            {t('Πρόοδος ομάδας', 'Group progress')}
          </span>
          <span className={cn('text-xs font-bold tabular-nums', onPhoto ? 'text-white' : tok.accentText)}>
            {current}/{target} {t('μέλη', 'members')}
          </span>
        </div>
      )}
      <div
        className={cn(
          'h-2 w-full overflow-hidden rounded-full',
          onPhoto ? 'bg-white/25' : tok.isDark ? 'bg-gray-700/50' : 'bg-gray-100',
        )}
        role="progressbar"
        aria-label={t('Πρόοδος ομάδας', 'Group progress')}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuetext={t(`${current} από ${target} μέλη`, `${current} of ${target} members`)}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', {
            'bg-fuchsia-500': tok.accent === 'fuchsia',
            'bg-indigo-500': tok.accent === 'indigo',
            'bg-emerald-500': tok.accent === 'emerald',
            'bg-accent': tok.accent === 'cyan',
            'bg-[hsl(220_14%_12%)]': tok.accent === 'ab',
          })}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
