import type { Event } from '../src/types';
import {
  initEventsDb,
  insertEventDb,
  listEventsFromDb,
  seedEventsDb,
  updateEventDb,
} from './eventsDb.ts';

let catalogLoaded = false;

async function seedFromMocks(): Promise<Event[]> {
  const { mockEvents } = await import('../src/data/mockEvents.ts');
  const { mockCalendarPlanEvents } = await import('../src/data/mockCalendarPlan.ts');
  return [...mockEvents, ...mockCalendarPlanEvents];
}

async function ensureCatalog(): Promise<void> {
  if (catalogLoaded) return;
  await initEventsDb();
  const existing = listEventsFromDb();
  if (existing.length === 0) {
    const seeded = await seedFromMocks();
    seedEventsDb(seeded);
  }
  catalogLoaded = true;
}

export async function loadEventsCatalog(): Promise<Event[]> {
  await ensureCatalog();
  return listEventsFromDb();
}

export async function listEvents(): Promise<Event[]> {
  return [...(await loadEventsCatalog())];
}

export async function createEvent(payload: Omit<Event, 'id'> & { id?: string }): Promise<Event> {
  await ensureCatalog();
  const event: Event = {
    ...payload,
    id: payload.id ?? `e${Date.now()}`,
  } as Event;
  insertEventDb(event);
  return event;
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<Event | null> {
  await ensureCatalog();
  return updateEventDb(id, patch);
}
