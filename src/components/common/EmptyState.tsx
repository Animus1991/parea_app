import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { ASK_AI_EMPTY, askCopilot } from '../../lib/askCopilot';
import { NakamasMini, type NakamasMiniId } from '../illustrations/NakamasMini';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Original Nakamas mini — used instead of the Lucide well when set. */
  character?: NakamasMiniId;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional quieter second path — never replaces the primary CTA. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /**
   * When true (and no explicit secondary), offer Ask AI as the secondary path.
   * Pass `askPrompt` to seed the copilot with page-aware wording.
   */
  askAi?: boolean;
  askLabel?: string;
  askPrompt?: string;
  className?: string;
}

/** Token-driven empty state: soft brand icon well, title, optional description + CTA. */
export function EmptyState({
  icon: Icon,
  character,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  askAi = false,
  askLabel,
  askPrompt,
  className,
}: EmptyStateProps) {
  const { t } = useLanguage();
  const resolvedSecondaryLabel =
    secondaryLabel ??
    (askAi ? askLabel ?? t(ASK_AI_EMPTY.labelEl, ASK_AI_EMPTY.labelEn) : undefined);
  const resolvedSecondary =
    onSecondary ??
    (askAi
      ? () =>
          askCopilot(
            askPrompt ?? t(ASK_AI_EMPTY.promptEl, ASK_AI_EMPTY.promptEn),
          )
      : undefined);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-7 px-4 text-center rounded-2xl border border-dashed border-border bg-surface-raised',
        className,
      )}
    >
      {character ? (
        <NakamasMini id={character} size={48} className="mb-2" />
      ) : Icon ? (
        <div className="w-8 h-8 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-2">
          <Icon className="w-4 h-4" aria-hidden />
        </div>
      ) : null}
      {/* Inside-card type ≤ page title (text-sm); subtitle < title */}
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && (
        <p className="text-xs font-medium text-ink-muted max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      )}
      {(actionLabel && onAction) || (resolvedSecondaryLabel && resolvedSecondary) ? (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {resolvedSecondaryLabel && resolvedSecondary && (
            <Button variant="ghost" size="md" onClick={resolvedSecondary}>
              {resolvedSecondaryLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
