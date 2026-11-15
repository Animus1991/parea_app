import type React from 'react';
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { pressable, redundantClick } from '../../lib/a11y';

export function Card({
  children,
  className,
  onClick,
  containsControls = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /**
   * The card holds its own buttons or links. The click stays as a mouse shortcut and
   * keyboard users reach the same action through a control inside (no nested buttons).
   */
  containsControls?: boolean;
}) {
  const p = usePageContrast();

  const hoverAccent = onClick ? p.cardHover : '';

  return (
    <div
      {...(onClick
        ? containsControls
          ? redundantClick<HTMLDivElement>(onClick)
          : pressable<HTMLDivElement>((e) => onClick(e as React.MouseEvent<HTMLDivElement>))
        : {})}
      className={cn(
        'rounded-2xl border',
        p.isAB && !p.isDark
          ? 'bg-white border-[hsl(220_13%_92%)]/60 shadow-soft'
          : p.isAB && p.isDark
            ? 'bg-[hsl(220_16%_11%)] border-[hsl(220_13%_18%)] shadow-soft'
            : p.isDark
              ? 'bg-gray-800/60 border-gray-700/50 shadow-soft'
              : 'bg-white border-gray-100 shadow-soft',
        p.isDark && p.body,
        onClick &&
          cn(
            'cursor-pointer transition-all duration-200 hover:-translate-y-[0.5px]',
            p.isAB || p.isDark ? 'hover:shadow-soft-md' : 'hover:shadow-soft-md',
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
  return <h3 className={cn('card-heading font-bold', p.head, className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  const p = usePageContrast();
  return <p className={cn('card-copy-sm font-medium', p.sub, className)}>{children}</p>;
}

export function CardMuted({ children, className }: { children: ReactNode; className?: string }) {
  const p = usePageContrast();
  return <p className={cn('card-meta font-medium', p.muted, className)}>{children}</p>;
}

export { CardInterestLine } from './CardInterestLine';
export { CardMetaLine, CardMetaDot } from './CardMetaLine';
