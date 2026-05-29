import { ReactNode } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { cn } from '../../lib/utils';

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  onClear: () => void;
  children: ReactNode;
}

export function FilterBottomSheet({
  open,
  onClose,
  activeCount,
  onClear,
  children,
}: FilterBottomSheetProps) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const c = useContrastTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className={cn('absolute inset-0 backdrop-blur-sm', c.modalOverlay)}
        onClick={onClose}
        aria-label={t('Κλείσιμο', 'Close')}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-5 pb-28 shadow-2xl animate-in slide-in-from-bottom duration-300',
          c.modalPanel,
        )}
      >
        <div className={cn('mx-auto mb-4 h-1 w-10 rounded-full', tok.isDark ? 'bg-gray-500' : 'bg-gray-300')} />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className={cn('h-5 w-5', tok.accentText)} />
            <h2 className={cn('text-base font-bold', tok.head)}>
              {t('Φίλτρα', 'Filters')}
              {activeCount > 0 && (
                <span className={cn('ml-2 text-xs font-bold', tok.accentText)}>
                  ({activeCount})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-full p-2 min-h-11 min-w-11 flex items-center justify-center',
              tok.chipButton,
            )}
            aria-label={t('Κλείσιμο', 'Close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5">{children}</div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'flex-1 min-h-11 rounded-2xl border text-sm font-bold',
              c.border,
              c.fgMuted,
            )}
          >
            {t('Εκκαθάριση', 'Clear all')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex-[2] min-h-11 rounded-2xl text-sm font-bold text-white',
              tok.primaryBtn,
            )}
          >
            {t('Εφαρμογή', 'Apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
