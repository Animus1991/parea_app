import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store';
import { queryKeys } from '../lib/queryClient';
import { api } from '../lib/apiClient';
import { mergeNotificationLists } from '../lib/notificationsUtil';
import { isLiveCatalogEvent } from '../lib/eventDisplay';
import type { Event } from '../types';
import type { AppNotification } from '../data/mockNotifications';

interface EventsApiResponse {
  events: Event[];
  source: string;
}

interface NotificationsApiResponse {
  notifications: AppNotification[];
}

/**
 * Server-state for events — fetches `/api/events` and hydrates Zustand when available.
 * Uses placeholderData (not initialData) so first-fetch pending is observable when cache is empty.
 * Soft-fails to Zustand cache on network error; throws only when there is nothing to show.
 */
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
          // Keep mini outings / user-created events the public catalog omits.
          hydrateEventsFromApi(res.events);
          return useStore.getState().events;
        }
        return useStore.getState().events;
      } catch (err) {
        const cached = useStore.getState().events;
        if (cached.length > 0) return cached;
        throw err;
      } finally {
        setEventsLoading(false);
      }
    },
    placeholderData: (previous) => previous ?? storeEvents,
    staleTime: 30_000,
  });
}

/** Normalized loading / error / data for list pages that depend on events. */
export function useEventsResource() {
  const query = useEventsQuery();
  const events = useMemo(
    () => (query.data ?? []).filter(isLiveCatalogEvent),
    [query.data],
  );
  return {
    events,
    isLoading: query.isPending && events.length === 0,
    isError: query.isError && events.length === 0,
    isRefreshing: query.isFetching && !query.isPending && events.length > 0,
    refetch: query.refetch,
  };
}

export function useNotificationsQuery() {
  const userId = useStore((s) => s.currentUser?.id);
  const notifications = useStore((s) => s.notifications);

  return useQuery({
    queryKey: queryKeys.notifications(userId ?? 'guest'),
    queryFn: async () => {
      try {
        const res = await api.get<NotificationsApiResponse>('/api/notifications');
        return res.notifications ?? useStore.getState().notifications;
      } catch (err) {
        const cached = useStore.getState().notifications;
        if (cached.length > 0) return cached;
        throw err;
      }
    },
    enabled: Boolean(userId),
    placeholderData: (previous) => previous ?? notifications,
    staleTime: 15_000,
  });
}

export function useNotificationsResource() {
  const query = useNotificationsQuery();
  const storeNotifications = useStore((s) => s.notifications);
  const notifications = useMemo(
    () => mergeNotificationLists(query.data ?? [], storeNotifications),
    [query.data, storeNotifications],
  );
  return {
    notifications,
    isLoading: query.isPending && notifications.length === 0,
    isError: query.isError && notifications.length === 0,
    refetch: query.refetch,
  };
}
