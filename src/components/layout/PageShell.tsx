import React from 'react';
import { cn } from '../../lib/utils';

interface PageShellProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  noPadding?: boolean;
  className?: string;
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageShell({
  title,
  description,
  actions,
  children,
  maxWidth = 'full',
  noPadding = false,
  className,
}: PageShellProps) {
  return (
    <div className={cn('min-h-full w-full', !noPadding && 'pb-4', className)}>
      <div className={cn('mx-auto w-full min-w-0', maxWidthClass[maxWidth])}>
        {(title || actions) && (
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              {title && (
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
}

export function StatCard({ label, value, sub, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-300" aria-hidden />}
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
