import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store';
import { queryKeys } from '../lib/queryClient';
import { api } from '../lib/apiClient';
import type { Event } from '../types';
import type { AppNotification } from '../data/mockNotifications';

interface EventsApiResponse {
  events: Event[];
  source: string;
}

interface NotificationsApiResponse {
  notifications: AppNotification[];
}

/** Server-state for events — fetches `/api/events` and hydrates Zustand when available. */
export function useEventsQuery() {
  const storeEvents = useStore((s) => s.events);
  const hydrateEventsFromApi = useStore((s) => s.hydrateEventsFromApi);
  const setEventsLoading = useStore((s) => s.setEventsLoading);

  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      setEventsLoading(true);
      try {
        const res = await api.get<EventsApiResponse>('/api/events');
        if (res.events?.length) {
          hydrateEventsFromApi(res.events);
          return res.events;
        }
        return storeEvents;
      } catch {
        return storeEvents;
      } finally {
        setEventsLoading(false);
      }
    },
    initialData: storeEvents,
    staleTime: 30_000,
  });
}

export function useNotificationsQuery() {
  const userId = useStore((s) => s.currentUser?.id);
  const notifications = useStore((s) => s.notifications);

  return useQuery({
    queryKey: queryKeys.notifications(userId ?? 'guest'),
    queryFn: async () => {
      try {
        const res = await api.get<NotificationsApiResponse>('/api/notifications');
        return res.notifications ?? notifications;
      } catch {
        return notifications;
      }
    },
    enabled: Boolean(userId),
    initialData: notifications,
    staleTime: 15_000,
  });
}
