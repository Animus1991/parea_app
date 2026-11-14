import { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { BottomSheet } from './BottomSheet';
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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      rootClassName="md:hidden z-sheet"
      title={undefined}
      showClose={false}
      className="pb-28"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <SlidersHorizontal className="h-5 w-5 text-accent" />
          <h2 className="text-base font-bold">
            {t('Φίλτρα', 'Filters')}
            {activeCount > 0 && (
              <span className="ml-2 text-xs font-bold text-accent">({activeCount})</span>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-2 min-h-11 text-sm font-bold text-ink-muted hover:bg-surface"
          aria-label={t('Κλείσιμο', 'Close')}
        >
          {t('Κλείσιμο', 'Close')}
        </button>
      </div>
      <div className="space-y-5 text-ink">{children}</div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 min-h-11 rounded-2xl border border-border text-sm font-bold text-ink-muted"
        >
          {t('Εκκαθάριση', 'Clear all')}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className={cn('flex-[2] min-h-11 rounded-2xl text-sm font-bold bg-accent text-accent-fg hover:bg-accent-strong')}
        >
          {t('Εφαρμογή', 'Apply')}
        </button>
      </div>
    </BottomSheet>
  );
}
