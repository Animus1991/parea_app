/**
 * In-memory events catalog for dev/prototype API (CoFounderBay server-state pattern).
 */
import type { Event } from '../src/types';

let catalog: Event[] | null = null;

export async function loadEventsCatalog(): Promise<Event[]> {
  if (catalog) return catalog;
  const { mockEvents } = await import('../src/data/mockEvents.ts');
  const { mockCalendarPlanEvents } = await import('../src/data/mockCalendarPlan.ts');
  catalog = [...mockEvents, ...mockCalendarPlanEvents];
  return catalog;
}

export async function listEvents(): Promise<Event[]> {
  return [...(await loadEventsCatalog())];
}

export async function createEvent(payload: Omit<Event, 'id'> & { id?: string }): Promise<Event> {
  const events = await loadEventsCatalog();
  const event: Event = {
    ...payload,
    id: payload.id ?? `e${Date.now()}`,
  } as Event;
  catalog = [...events, event];
  return event;
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<Event | null> {
  const events = await loadEventsCatalog();
  const idx = events.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const updated = { ...events[idx], ...patch, id };
  catalog = events.map((e, i) => (i === idx ? updated : e));
  return updated;
}
