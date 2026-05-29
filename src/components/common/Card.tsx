import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export function Card({ children, className, onClick, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  const p = usePageContrast();

  const hoverAccent = onClick ? p.cardHover : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border',
        p.isAB && !p.isDark
          ? 'bg-white border-[hsl(220_13%_92%)]/60 shadow-sm'
          : p.isAB && p.isDark
            ? 'bg-[hsl(220_16%_11%)] border-[hsl(220_13%_18%)] shadow-sm'
            : p.isDark
              ? 'bg-gray-800/60 border-gray-700/50 shadow-soft'
              : 'bg-white border-gray-100 shadow-soft',
        p.isDark && p.body,
        onClick &&
          cn(
            'cursor-pointer transition-all duration-200 hover:-translate-y-[0.5px]',
            p.isAB || p.isDark ? 'hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.09)]' : 'hover:shadow-soft-md',
            hoverAccent,
          ),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Default typography inside cards when children omit explicit colors. */
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  const p = usePageContrast();
  return <h3 className={cn('font-bold', p.head, className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  const p = usePageContrast();
  return <p className={cn('text-sm font-medium', p.sub, className)}>{children}</p>;
}

export function CardMuted({ children, className }: { children: ReactNode; className?: string }) {
  const p = usePageContrast();
  return <p className={cn('text-xs font-medium', p.muted, className)}>{children}</p>;
}
