/**
 * Friend invitations on the server (Φ28) — so a link sent from one phone opens
 * on another. Only the invite *card* is public (event, area, host first name,
 * counts). Guests' names are readable with the host key only; the server keeps
 * a SHA-256 of that key, never the key itself.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const INVITE_ID_PATTERN = /^[A-Za-z0-9_-]{3,64}$/;
export const MAX_RESPONSES_PER_INVITE = 100;

export interface InviteCard {
  eventId: string;
  eventTitle: string;
  date: string;
  time: string;
  area: string;
  category: string;
  coverId: string;
  hostFirstName: string;
  members: number;
  targetSize: number;
  closed: boolean;
}

export type InviteStatus = 'going' | 'maybe' | 'no';

export interface StoredResponse {
  id: string;
  name: string;
  status: InviteStatus;
  at: string;
}

export function openInvitesDb(file = path.join(process.cwd(), 'data', 'runtime', 'invites.db')): DatabaseSync {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS plan_invites (
      id TEXT PRIMARY KEY NOT NULL,
      card TEXT NOT NULL,
      host_key_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invite_responses (
      id TEXT PRIMARY KEY NOT NULL,
      invite_id TEXT NOT NULL,
      name_key TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      at TEXT NOT NULL,
      UNIQUE (invite_id, name_key)
    );
  `);
  return db;
}

/** Drops control characters (code points below 32, and 127) without a control-char regex. */
const stripControl = (v: string) => Array.from(v).filter((ch) => { const c = ch.codePointAt(0) ?? 0; return c >= 32 && c !== 127; }).join('');
const str = (v: unknown, max: number) => (typeof v === 'string' ? stripControl(v).trim().slice(0, max) : '');
const int = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : null;
};

/** Accepts only the public fields, bounded; anything else is dropped. */
export function sanitizeCard(raw: unknown): InviteCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const card: InviteCard = {
    eventId: str(r.eventId, 64),
    eventTitle: str(r.eventTitle, 140),
    date: str(r.date, 10),
    time: str(r.time, 5),
    area: str(r.area, 80),
    category: str(r.category, 40),
    coverId: str(r.coverId, 40),
    hostFirstName: str(r.hostFirstName, 40),
    members: int(r.members, 0, 50) ?? -1,
    targetSize: int(r.targetSize, 1, 50) ?? -1,
    closed: r.closed === true,
  };
  if (!card.eventId || !card.eventTitle || !/^\d{4}-\d{2}-\d{2}$/.test(card.date) || !/^\d{1,2}:\d{2}$/.test(card.time)) return null;
  if (card.members < 0 || card.targetSize < 1) return null;
  return card;
}

export function sanitizeResponse(raw: unknown): { name: string; status: InviteStatus } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name, 40).replace(/\s+/g, ' ');
  const status = r.status;
  if (name.length < 2 || (status !== 'going' && status !== 'maybe' && status !== 'no')) return null;
  return { name, status };
}

const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');

function keyMatches(stored: string, key: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(hashKey(key));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validHostKey(key: unknown): key is string {
  return typeof key === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(key);
}

/** First publish claims the invite id with the host key; later ones must present it. */
export function upsertInvite(db: DatabaseSync, id: string, card: InviteCard, hostKey: string): 'created' | 'updated' | 'forbidden' {
  const row = db.prepare('SELECT host_key_hash FROM plan_invites WHERE id = ?').get(id) as { host_key_hash: string } | undefined;
  if (row && !keyMatches(row.host_key_hash, hostKey)) return 'forbidden';
  if (row) {
    db.prepare("UPDATE plan_invites SET card = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(card), id);
    return 'updated';
  }
  db.prepare('INSERT INTO plan_invites (id, card, host_key_hash) VALUES (?, ?, ?)').run(id, JSON.stringify(card), hashKey(hostKey));
  return 'created';
}

/** The public view: the card and counts — never names. */
export function getPublicInvite(db: DatabaseSync, id: string): { card: InviteCard; going: number; maybe: number } | null {
  const row = db.prepare('SELECT card FROM plan_invites WHERE id = ?').get(id) as { card: string } | undefined;
  if (!row) return null;
  const counts = db
    .prepare('SELECT status, COUNT(*) AS n FROM invite_responses WHERE invite_id = ? GROUP BY status')
    .all(id) as { status: string; n: number }[];
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  return { card: JSON.parse(row.card) as InviteCard, going: n('going'), maybe: n('maybe') };
}

/** One answer per name (case-insensitive); answering again updates it. */
export function addResponse(
  db: DatabaseSync,
  inviteId: string,
  input: { name: string; status: InviteStatus },
  now = new Date(),
): StoredResponse | 'not_found' | 'closed' | 'full' {
  const pub = getPublicInvite(db, inviteId);
  if (!pub) return 'not_found';
  if (pub.card.closed) return 'closed';
  const nameKey = input.name.toLocaleLowerCase('el');
  const existing = db
    .prepare('SELECT id FROM invite_responses WHERE invite_id = ? AND name_key = ?')
    .get(inviteId, nameKey) as { id: string } | undefined;
  const at = now.toISOString();
  if (existing) {
    db.prepare('UPDATE invite_responses SET name = ?, status = ?, at = ? WHERE id = ?').run(input.name, input.status, at, existing.id);
    return { id: existing.id, name: input.name, status: input.status, at };
  }
  const total = (db.prepare('SELECT COUNT(*) AS n FROM invite_responses WHERE invite_id = ?').get(inviteId) as { n: number }).n;
  if (total >= MAX_RESPONSES_PER_INVITE) return 'full';
  const id = `r_${createHash('sha256').update(`${inviteId}|${nameKey}`).digest('hex').slice(0, 16)}`;
  db.prepare('INSERT INTO invite_responses (id, invite_id, name_key, name, status, at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    inviteId,
    nameKey,
    input.name,
    input.status,
    at,
  );
  return { id, name: input.name, status: input.status, at };
}

/** Names, for the host only. */
export function listResponses(db: DatabaseSync, inviteId: string, hostKey: string): StoredResponse[] | 'forbidden' | 'not_found' {
  const row = db.prepare('SELECT host_key_hash FROM plan_invites WHERE id = ?').get(inviteId) as { host_key_hash: string } | undefined;
  if (!row) return 'not_found';
  if (!keyMatches(row.host_key_hash, hostKey)) return 'forbidden';
  return db
    .prepare('SELECT id, name, status, at FROM invite_responses WHERE invite_id = ? ORDER BY at, rowid')
    .all(inviteId) as unknown as StoredResponse[];
}
