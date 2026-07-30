import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageTitleProps {
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

/** Token-driven page heading (H1) with optional supporting subtitle. */
export function PageTitle({ children, subtitle, className }: PageTitleProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-ink">{children}</h1>
      {subtitle && <p className="text-sm font-medium text-ink-muted">{subtitle}</p>}
    </div>
  );
}
