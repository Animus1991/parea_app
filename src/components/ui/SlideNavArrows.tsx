import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export interface SlideNavArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  /** Outside: flank centered panel on md+; inside: overlay on hero (still hidden on mobile). */
  placement?: 'inside' | 'outside';
  className?: string;
}

const btnBase =
  'items-center justify-center rounded-full border backdrop-blur-md transition-all min-h-11 min-w-11 z-30 disabled:opacity-25 disabled:pointer-events-none hover:scale-105 active:scale-95';

const btnDark = 'bg-black/55 border-white/20 text-white hover:bg-black/70 shadow-lg';

/**
 * Visible prev/next chevrons on md+ for multi-item story modals.
 * Mobile keeps tap zones / inner controls elsewhere.
 */
export function SlideNavArrows({
  onPrev,
  onNext,
  canPrev,
  canNext,
  placement = 'outside',
  className,
}: SlideNavArrowsProps) {
  const { t } = useLanguage();

  if (placement === 'outside') {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          disabled={!canPrev}
          aria-label={t('Προηγούμενη', 'Previous')}
          className={cn(
            'hidden md:flex fixed left-4 lg:left-8 top-1/2 -translate-y-1/2',
            btnBase,
            btnDark,
            className,
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={!canNext}
          aria-label={t('Επόμενη', 'Next')}
          className={cn(
            'hidden md:flex fixed right-4 lg:right-8 top-1/2 -translate-y-1/2',
            btnBase,
            btnDark,
            className,
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={!canPrev}
        aria-label={t('Προηγούμενη', 'Previous')}
        className={cn(
          'hidden md:flex absolute left-3 top-1/2 -translate-y-1/2',
          btnBase,
          btnDark,
          className,
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={!canNext}
        aria-label={t('Επόμενη', 'Next')}
        className={cn(
          'hidden md:flex absolute right-3 top-1/2 -translate-y-1/2',
          btnBase,
          btnDark,
          className,
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  );
}
