import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useWallStore } from '../../store/wallStore';
import type { Audience } from '../../types/wall';
import { cn } from '../../lib/utils';
import { AUDIENCE_ICON, audienceLabel } from './wallText';

/**
 * Compact "who sees this" pill. Interactive when `onClick` is given (the
 * author changing it), otherwise a plain label with an accessible name.
 */
export function AudienceChip({
  audience,
  onClick,
  className,
  prefix,
}: {
  audience: Audience;
  onClick?: () => void;
  className?: string;
  /** e.g. «Ορατό σε:» */
  prefix?: string;
}) {
  const { t } = useLanguage();
  const lists = useWallStore((s) => s.lists);
  const Icon = AUDIENCE_ICON[audience.base];
  const label = audienceLabel(audience, t, lists);
  const body = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        {prefix ? `${prefix} ` : ''}
        {label}
      </span>
      {onClick && <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />}
    </>
  );
  const base = 'inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-xs font-medium text-ink';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, 'min-h-8 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', className)}
        aria-label={t(`Κοινό: ${label}. Αλλαγή`, `Audience: ${label}. Change`)}
      >
        {body}
      </button>
    );
  }
  return (
    <span className={cn(base, 'min-h-6', className)} title={t(`Ορατό σε: ${label}`, `Visible to: ${label}`)}>
      <span className="sr-only">{t('Ορατό σε:', 'Visible to:')}</span>
      {body}
    </span>
  );
}
