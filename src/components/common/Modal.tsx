import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useLanguage } from '../../lib/i18n';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

export function Modal({ open, onClose, title, children, className, showClose = true }: ModalProps) {
  const { t } = useLanguage();
  const c = useContrastTheme();
  const p = usePageContrast();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className={cn('absolute inset-0 backdrop-blur-sm', c.modalOverlay)}
        onClick={onClose}
        aria-label={t('Κλείσιμο', 'Close')}
      />
      <div
        className={cn(
          'relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200',
          c.modalPanel,
          className,
        )}
      >
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {title && <h2 className={cn('text-lg font-bold', p.head)}>{title}</h2>}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'ml-auto rounded-full p-2 min-h-11 min-w-11 flex items-center justify-center shrink-0',
                  p.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600',
                )}
                aria-label={t('Κλείσιμο', 'Close')}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn('text-sm font-medium', p.body)}>{children}</div>
      </div>
    </div>
  );
}
