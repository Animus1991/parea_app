import { ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Panel class overrides (padding, spacing, width fine-tuning). */
  className?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg';
  closeOnScrim?: boolean;
  labelledBy?: string;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Unified modal primitive (P2-T4): portal στο body, scroll lock, Escape,
 * focus trap + focus restore, scrim click, z-modal token — όλα από το
 * useOverlayBehavior core. Token-driven panel (bg-surface-raised/text-ink),
 * theme-adaptive χωρίς per-theme branches.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  showClose = true,
  size = 'md',
  closeOnScrim = true,
  labelledBy,
}: ModalProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('Κλείσιμο', 'Close')}
        onClick={closeOnScrim ? onClose : undefined}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 motion-reduce:animate-none"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface-raised text-ink shadow-soft-lg p-4 outline-none',
          'animate-in zoom-in-95 fade-in duration-200 motion-reduce:animate-none',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {title && (
              <h2 id={titleId} className="text-sm md:text-base font-bold text-ink">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-full p-2 min-h-11 min-w-11 flex items-center justify-center shrink-0 text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                aria-label={t('Κλείσιμο', 'Close')}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="text-sm font-medium text-ink-muted">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
