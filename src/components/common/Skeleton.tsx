import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { isDarkTheme } from '../../lib/themes';
import { useLanguage } from '../../lib/i18n';

/**
 * Loading placeholders.
 * Φ25 (port from nakamas): every composite skeleton is an accessible
 * `role="status"` region with `aria-busy` and a localized label, and list
 * pages get shape-accurate variants instead of a generic block.
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  const theme = useStore((s) => s.theme);
  const isDark = isDarkTheme(theme);
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg motion-reduce:animate-none', isDark ? 'bg-gray-700/40' : 'bg-gray-200', className)}
    />
  );
}

function Status({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function EventCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' } = {}) {
  const theme = useStore((s) => s.theme);
  const { t } = useLanguage();
  const isDark = isDarkTheme(theme);
  const shell = cn('rounded-2xl border shadow-soft h-full flex flex-col', isDark ? 'border-gray-700/40 bg-gray-800/60' : 'border-gray-100 bg-white');
  if (variant === 'compact') {
    return (
      <Status label={t('Φόρτωση εκδήλωσης…', 'Loading event…')} className={cn(shell, 'overflow-hidden')}>
        <Skeleton className="h-32 w-full rounded-none" />
        <div className="p-4 flex flex-col flex-1 gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <div className="mt-auto space-y-2 pt-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </Status>
    );
  }
  return (
    <Status label={t('Φόρτωση εκδήλωσης…', 'Loading event…')} className={cn(shell, 'p-4')}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className={cn('mt-auto pt-3 border-t space-y-2', isDark ? 'border-gray-700/40' : 'border-gray-50')}>
        <div className="flex justify-between items-center mb-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between items-center mt-3 pt-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-8 w-12 rounded-full" />
        </div>
      </div>
    </Status>
  );
}

/** Horizontal stories rail placeholder (Home). */
export function EventStoriesSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useLanguage();
  return (
    <Status label={t('Φόρτωση στιγμιοτύπων…', 'Loading stories…')} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="shrink-0 w-[108px] h-[156px] rounded-2xl" />
        ))}
      </div>
    </Status>
  );
}

export type ListSkeletonVariant = 'compact-event' | 'avatar-row' | 'notification-row' | 'transaction-row' | 'connection-card';

export function ListItemSkeleton({ variant = 'compact-event' }: { variant?: ListSkeletonVariant }) {
  const theme = useStore((s) => s.theme);
  const isDark = isDarkTheme(theme);
  const card = cn('rounded-2xl border', isDark ? 'border-gray-700/40 bg-gray-800/60' : 'border-gray-100 bg-white');
  switch (variant) {
    case 'avatar-row':
      return (
        <div className="flex items-center gap-4 p-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-center gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      );
    case 'notification-row':
      return (
        <div className={cn(card, 'flex gap-3.5 p-3.5')}>
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      );
    case 'transaction-row':
      return (
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5 min-w-0 flex-1">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      );
    case 'connection-card':
      return (
        <div className={cn(card, 'p-4 flex items-center justify-between gap-3')}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      );
    default:
      return (
        <div className={cn(card, 'p-4 flex gap-4')}>
          <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 py-0.5">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
  }
}

export function ListViewSkeleton({
  count = 4,
  variant = 'compact-event',
  className,
}: {
  count?: number;
  variant?: ListSkeletonVariant;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <Status label={t('Φόρτωση λίστας…', 'Loading list…')} className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} variant={variant} />
      ))}
    </Status>
  );
}

export function ProfileSkeleton() {
  const { t } = useLanguage();
  return (
    <Status label={t('Φόρτωση προφίλ…', 'Loading profile…')} className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <div className="p-4 border rounded-xl space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </Status>
  );
}

export function EventDetailSkeleton() {
  const { t } = useLanguage();
  return (
    <Status label={t('Φόρτωση εκδήλωσης…', 'Loading event…')} className="space-y-4">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="space-y-3 mt-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Status>
  );
}
