import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export interface HorizontalScrollArrowsProps {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  /** Min items before arrows show on md+ (default 2). */
  minItemsForArrows?: number;
  itemCount?: number;
  scrollStep?: number;
}

/** Horizontal rail with functional left/right arrows on md+ when content overflows. */
export function HorizontalScrollArrows({
  children,
  className,
  scrollClassName,
  minItemsForArrows = 2,
  itemCount = 0,
  scrollStep = 280,
}: HorizontalScrollArrowsProps) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(max > 8 && el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, itemCount]);

  const scroll = (dir: -1 | 1) => {
    ref.current?.scrollBy({ left: dir * scrollStep, behavior: 'smooth' });
  };

  const showArrows = itemCount >= minItemsForArrows;

  return (
    <div className={cn('relative', className)}>
      {showArrows && canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={t('Προηγούμενες', 'Scroll previous')}
          className={cn(
            'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20',
            'min-h-10 min-w-10 items-center justify-center rounded-full',
            'bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-white/15',
            'shadow-md text-gray-800 dark:text-white hover:scale-105 active:scale-95 transition-transform',
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {showArrows && canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={t('Επόμενες', 'Scroll next')}
          className={cn(
            'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20',
            'min-h-10 min-w-10 items-center justify-center rounded-full',
            'bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-white/15',
            'shadow-md text-gray-800 dark:text-white hover:scale-105 active:scale-95 transition-transform',
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div
        ref={ref}
        className={cn(
          scrollClassName,
          showArrows && 'md:px-10',
        )}
      >
        {children}
      </div>
    </div>
  );
}
