import { ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Extra classes για το fixed root (π.χ. responsive gating «xl:hidden»). */
  rootClassName?: string;
  showClose?: boolean;
  closeOnScrim?: boolean;
  labelledBy?: string;
}

/**
 * Unified bottom-sheet primitive (P2-T4) — ίδιο core με το Modal
 * (portal, scroll lock, Escape, focus trap + restore), αγκυρωμένο κάτω
 * με drag handle. Token-driven, theme-adaptive.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  rootClassName,
  showClose = true,
  closeOnScrim = true,
  labelledBy,
}: BottomSheetProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-modal flex items-end justify-center', rootClassName)}
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
          'relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-x border-border bg-surface-raised text-ink shadow-soft-lg px-4 pt-2 pb-5 outline-none',
          'animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
          className,
        )}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-border-strong mb-3" aria-hidden />
        {(title || showClose) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            {title && (
              <h2 id={titleId} className="text-lg font-bold text-ink">
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
