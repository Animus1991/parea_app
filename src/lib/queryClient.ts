import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) return error.isRetryable;
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: { retry: 0 },
  },
});

export const queryKeys = {
  events: ['events'] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
  health: ['health'] as const,
} as const;

export default queryClient;
