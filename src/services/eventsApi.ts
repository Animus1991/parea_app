import { api } from '../lib/apiClient';
import type { Event } from '../types';

export interface EventsListResponse {
  events: Event[];
  source: string;
  count?: number;
}

export async function fetchEventsFromApi(): Promise<Event[]> {
  const res = await api.get<EventsListResponse>('/api/events');
  return res.events ?? [];
}

export async function createEventOnApi(
  payload: Omit<Event, 'id'> & { id?: string },
): Promise<Event> {
  const res = await api.post<{ event: Event }>('/api/events', { json: payload });
  return res.event;
}

export async function updateEventOnApi(id: string, patch: Partial<Event>): Promise<Event> {
  const res = await api.put<{ event: Event }>(`/api/events/${encodeURIComponent(id)}`, {
    json: patch,
  });
  return res.event;
}
