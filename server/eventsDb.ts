import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Event } from '../src/types';

const RUNTIME_DIR = path.join(process.cwd(), 'data', 'runtime');
const DB_PATH = path.join(RUNTIME_DIR, 'events.db');
const LEGACY_JSON = path.join(RUNTIME_DIR, 'events.json');

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function rowToEvent(row: { payload: string }): Event {
  return JSON.parse(row.payload) as Event;
}

function migrateFromLegacyJson(): void {
  const database = getDb();
  const count = database.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number };
  if (count.n > 0) return;

  try {
    const raw = fs.readFileSync(LEGACY_JSON, 'utf-8');
    const events = JSON.parse(raw) as Event[];
    if (!Array.isArray(events) || events.length === 0) return;
    const insert = database.prepare(
      "INSERT OR REPLACE INTO events (id, payload, updated_at) VALUES (?, ?, datetime('now'))",
    );
    for (const event of events) {
      insert.run(event.id, JSON.stringify(event));
    }
    console.info(`[eventsDb] migrated ${events.length} events from legacy JSON`);
  } catch {
    /* no legacy file */
  }
}

export async function initEventsDb(): Promise<void> {
  getDb();
  migrateFromLegacyJson();
}

export function listEventsFromDb(): Event[] {
  const database = getDb();
  const rows = database.prepare("SELECT payload FROM events ORDER BY json_extract(payload, '$.date')").all() as {
    payload: string;
  }[];
  return rows.map(rowToEvent);
}

export function seedEventsDb(events: Event[]): void {
  const database = getDb();
  const insert = database.prepare(
    "INSERT OR REPLACE INTO events (id, payload, updated_at) VALUES (?, ?, datetime('now'))",
  );
  database.exec('BEGIN');
  try {
    for (const event of events) {
      insert.run(event.id, JSON.stringify(event));
    }
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

export function insertEventDb(event: Event): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO events (id, payload, updated_at) VALUES (?, ?, datetime('now'))")
    .run(event.id, JSON.stringify(event));
}

export function updateEventDb(id: string, patch: Partial<Event>): Event | null {
  const database = getDb();
  const row = database.prepare('SELECT payload FROM events WHERE id = ?').get(id) as { payload: string } | undefined;
  if (!row) return null;
  const current = rowToEvent(row);
  const updated = { ...current, ...patch, id };
  database
    .prepare("UPDATE events SET payload = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(updated), id);
  return updated;
}
