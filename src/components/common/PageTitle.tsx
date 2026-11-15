import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { APP_TYPO } from '../../lib/typographyTokens';

interface PageTitleProps {
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

/** Token-driven page heading (H1) with optional supporting subtitle — Home scale. */
export function PageTitle({ children, subtitle, className }: PageTitleProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h1 className={cn(APP_TYPO.pageTitle, 'text-ink')}>{children}</h1>
      {subtitle && <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>{subtitle}</p>}
    </div>
  );
}
