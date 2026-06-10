import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store';
import { queryKeys } from '../lib/queryClient';
import { api } from '../lib/apiClient';

/** Server-state wrapper — today reads Zustand; ready for `/api/events` migration. */
export function useEventsQuery() {
  const storeEvents = useStore((s) => s.events);
  const eventsLoading = useStore((s) => s.eventsLoading);
  const eventsSource = useStore((s) => s.eventsSource);

  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      try {
        await api.get<{ ok: boolean }>('/api/health');
      } catch {
        /* offline / no server — fall back to store */
      }
      return storeEvents;
    },
    initialData: storeEvents,
    staleTime: 30_000,
    meta: { source: eventsSource, loading: eventsLoading },
  });
}

export function useNotificationsQuery() {
  const userId = useStore((s) => s.currentUser?.id);
  const notifications = useStore((s) => s.notifications);

  return useQuery({
    queryKey: queryKeys.notifications(userId ?? 'guest'),
    queryFn: async () => notifications,
    enabled: Boolean(userId),
    initialData: notifications,
    staleTime: 15_000,
  });
}
