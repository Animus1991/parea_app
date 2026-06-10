import { cn } from '../../lib/utils';

export function PlansFormingSkeleton({
  count = 2,
  variant = 'inline',
}: {
  count?: number;
  variant?: 'sidebar' | 'inline' | 'sheet';
}) {
  const isSidebar = variant === 'sidebar';
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-2xl border p-3 animate-pulse',
            isSidebar ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100 dark:bg-gray-800',
          )}
        >
          <div className="flex gap-3">
            <div className={cn('w-14 h-14 rounded-xl', isSidebar ? 'bg-white/10' : 'bg-gray-200 dark:bg-gray-700')} />
            <div className="flex-1 space-y-2">
              <div className={cn('h-2 w-16 rounded', isSidebar ? 'bg-white/10' : 'bg-gray-200')} />
              <div className={cn('h-3 w-full rounded', isSidebar ? 'bg-white/10' : 'bg-gray-200')} />
              <div className={cn('h-2 w-3/4 rounded', isSidebar ? 'bg-white/10' : 'bg-gray-200')} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
