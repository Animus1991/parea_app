import React from 'react';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  return (
    <div
      className={cn('animate-pulse rounded-md', isDark ? 'bg-gray-700/40' : 'bg-gray-200', className)}
    />
  );
}

export function EventCardSkeleton() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm h-full flex flex-col', isDark ? 'border-gray-700/40 bg-gray-800/60' : 'border-gray-100 bg-white')}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className={cn('mt-auto pt-3 border-t space-y-2', isDark ? 'border-gray-700/40' : 'border-gray-50')}>
        <div className="flex justify-between items-center mb-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between items-center mt-3 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="p-4 border rounded-xl space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 h-w-24 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="space-y-3 mt-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
