import fs from 'node:fs/promises';
import path from 'node:path';
import type { Event } from '../src/types';

const RUNTIME_DIR = path.join(process.cwd(), 'data', 'runtime');
const RUNTIME_FILE = path.join(RUNTIME_DIR, 'events.json');

let catalog: Event[] | null = null;

async function seedFromMocks(): Promise<Event[]> {
  const { mockEvents } = await import('../src/data/mockEvents.ts');
  const { mockCalendarPlanEvents } = await import('../src/data/mockCalendarPlan.ts');
  return [...mockEvents, ...mockCalendarPlanEvents];
}

async function persistCatalog(events: Event[]): Promise<void> {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
  await fs.writeFile(RUNTIME_FILE, JSON.stringify(events, null, 2), 'utf-8');
  catalog = events;
}

async function readPersistedCatalog(): Promise<Event[] | null> {
  try {
    const raw = await fs.readFile(RUNTIME_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Event[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadEventsCatalog(): Promise<Event[]> {
  if (catalog) return catalog;
  const persisted = await readPersistedCatalog();
  if (persisted?.length) {
    catalog = persisted;
    return catalog;
  }
  const seeded = await seedFromMocks();
  await persistCatalog(seeded);
  return catalog!;
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
  await persistCatalog([...events, event]);
  return event;
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<Event | null> {
  const events = await loadEventsCatalog();
  const idx = events.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const updated = { ...events[idx], ...patch, id };
  const next = events.map((e, i) => (i === idx ? updated : e));
  await persistCatalog(next);
  return updated;
}
