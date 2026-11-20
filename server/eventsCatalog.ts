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
  // Φ27 — our own «Nakamas Nights» series is part of the public catalog.
  const { mockOutingEvents } = await import('../src/data/mockOutings.ts');
  return [...mockEvents, ...mockCalendarPlanEvents, ...mockOutingEvents.filter((e) => e.series === 'nakamas_nights')];
}

async function ensureCatalog(): Promise<void> {
  if (catalogLoaded) return;
  await initEventsDb();
  const existing = listEventsFromDb();
  if (existing.length === 0) {
    const seeded = await seedFromMocks();
    seedEventsDb(seeded);
  } else {
    // Φ27 — catalogs created before «Nakamas Nights» get the series once.
    const have = new Set(existing.map((e) => e.id));
    const { mockOutingEvents } = await import('../src/data/mockOutings.ts');
    for (const e of mockOutingEvents) {
      if (e.series === 'nakamas_nights' && !have.has(e.id)) insertEventDb(e);
    }
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

export async function eventExists(id: string): Promise<boolean> {
  await ensureCatalog();
  return listEventsFromDb().some((e) => e.id === id);
}

export async function getEvent(id: string): Promise<Event | null> {
  await ensureCatalog();
  return listEventsFromDb().find((e) => e.id === id) ?? null;
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<Event | null> {
  await ensureCatalog();
  return updateEventDb(id, patch);
}
