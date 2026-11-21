/**
 * Friend invitations on the server (Φ28), so a link made on one phone opens on
 * another. Every call fails soft: on static hosting (no API) the app keeps
 * working with the invite on this device only, and says so. No error is
 * logged for a missing API — that is an expected state, not a fault.
 */
import { appEnv } from '../lib/config/env';
import type { InviteResponse } from '../types/outings';

export interface InviteCardDto {
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

export interface PublicInviteDto {
  card: InviteCardDto;
  going: number;
  maybe: number;
}

const TIMEOUT_MS = 4000;

function url(path: string): string {
  return `${appEnv.apiBaseUrl.replace(/\/$/, '')}${path}`;
}

async function call(path: string, init: RequestInit = {}): Promise<{ status: number; body: unknown } | null> {
  if (typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url(path), { ...init, signal: controller.signal });
    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    // A static host answers every path with index.html — that is «no API», not an invite.
    if (!isJson) return null;
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const json = (body: unknown, extra: Record<string, string> = {}): RequestInit => ({
  headers: { 'Content-Type': 'application/json', ...extra },
  body: JSON.stringify(body),
});

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Secure random is required to mint invite keys.');
  }
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A random key only the inviting device holds; the server stores its hash. */
export function newHostKey(): string {
  return randomHex(24);
}

/**
 * The invite link is all a guest needs to see the card, so its id is 96
 * random bits: nobody can guess or pre-claim another host's link.
 */
export function newInviteId(): string {
  return `inv_${randomHex(12)}`;
}

export async function publishInvite(id: string, card: InviteCardDto, hostKey: string): Promise<boolean> {
  const res = await call(`/api/invites/${encodeURIComponent(id)}`, { method: 'PUT', ...json({ card, hostKey }) });
  return Boolean(res && (res.status === 200 || res.status === 201));
}

export async function fetchPublicInvite(id: string): Promise<PublicInviteDto | null> {
  const res = await call(`/api/invites/${encodeURIComponent(id)}`);
  const body = res?.body as Partial<PublicInviteDto> | null | undefined;
  if (!res || res.status !== 200 || !body || typeof body !== 'object' || !body.card) return null;
  return { card: body.card, going: Number(body.going) || 0, maybe: Number(body.maybe) || 0 };
}

export type SendResponseResult = 'ok' | 'closed' | 'invalid' | 'unavailable';

export async function sendInviteResponse(id: string, name: string, status: InviteResponse['status']): Promise<SendResponseResult> {
  const res = await call(`/api/invites/${encodeURIComponent(id)}/responses`, { method: 'POST', ...json({ name, status }) });
  if (!res) return 'unavailable';
  if (res.status === 200 || res.status === 201) return 'ok';
  if (res.status === 409) return 'closed';
  if (res.status === 400) return 'invalid';
  return 'unavailable';
}

/** Names, for the inviting device only (it holds the host key). */
export async function fetchInviteResponses(id: string, hostKey: string): Promise<InviteResponse[] | null> {
  const res = await call(`/api/invites/${encodeURIComponent(id)}/responses`, { headers: { 'X-Invite-Key': hostKey } });
  const list = (res?.body as { responses?: unknown } | null | undefined)?.responses;
  if (!res || res.status !== 200 || !Array.isArray(list)) return null;
  return list
    .filter((r): r is InviteResponse => Boolean(r) && typeof (r as InviteResponse).name === 'string' && ['going', 'maybe', 'no'].includes((r as InviteResponse).status))
    .map((r) => ({ id: String(r.id), name: r.name.slice(0, 40), status: r.status, at: String(r.at) }));
}
