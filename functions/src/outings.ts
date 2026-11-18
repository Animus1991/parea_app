/**
 * Backend contract for group outings (Φ27) — pure functions a Cloud Function
 * (or any trusted server) runs. No Firebase dependency, so they are unit
 * tested here and reused when a Firebase project is attached.
 *
 * Why a backend: the demo derives door codes on the device (src/lib/checkIn.ts).
 * In production the code is an HMAC with a server secret, so nobody can mint a
 * valid ticket for someone else; the QR payload format stays the same
 * (`NKM1:{groupId}:{userId}:{code}`). Closing check-in, strikes and seat
 * hand-overs also run here, with the same rules as the app
 * (src/store/outingsSlice.ts, src/lib/consequences.ts).
 *
 * Suggested callables / triggers (Admin SDK pseudocode):
 *
 *   callable issueTicketCode({ groupId }) — member only:
 *     return ticketCode(SECRET, groupId, uid, now)
 *   callable checkIn({ groupId, payload | code }) — host only:
 *     const userId = verifyTicket(SECRET, group, payload | code, now)
 *     set(groups/{groupId}/checkIns/{userId}, { at, by: uid, method })
 *   callable closeCheckIn({ groupId }) — host only:
 *     const { strikes, rewards } = settleCheckIn(group, checkIns, now)
 *     batch strikes/{id}, profiles reliability (Admin SDK only), group.checkInClosedAt
 *   onUpdate(groups/{id}) member removed:
 *     write(handOverSeat(...)) — see src/store/outingsSlice.ts
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ATTENDED_RELIABILITY, STRIKE_RELIABILITY } from '../../src/lib/consequences';
import type { CheckInRecord, Strike } from '../../src/types/outings';

export const TICKET_WINDOW_MS = 30_000;

function windowOf(now: number) {
  return Math.floor(now / TICKET_WINDOW_MS);
}

/** 6-digit HMAC-SHA256 code (RFC 4226-style dynamic truncation). */
export function ticketCode(secret: string, groupId: string, userId: string, now: number): string {
  return codeFor(secret, groupId, userId, windowOf(now));
}

function codeFor(secret: string, groupId: string, userId: string, window: number): string {
  const mac = createHmac('sha256', secret).update(`NKM1|${groupId}|${userId}|${window}`).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}

function sameCode(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Which member does this ticket belong to? Accepts a QR payload or a typed
 * code, for the current and previous 30-second window only.
 */
export function verifyTicket(
  secret: string,
  group: { id: string; memberIds: string[] },
  input: { payload?: string; code?: string },
  now: number,
): { ok: true; userId: string; method: 'qr' | 'code' } | { ok: false; reason: 'format' | 'wrong_group' | 'not_member' | 'invalid' } {
  const w = windowOf(now);
  const valid = (uid: string, code: string) => sameCode(codeFor(secret, group.id, uid, w), code) || sameCode(codeFor(secret, group.id, uid, w - 1), code);
  if (input.payload) {
    const m = /^NKM1:([^:]+):([^:]+):(\d{6})$/.exec(input.payload.trim());
    if (!m) return { ok: false, reason: 'format' };
    const [, groupId, userId, code] = m;
    if (groupId !== group.id) return { ok: false, reason: 'wrong_group' };
    if (!group.memberIds.includes(userId)) return { ok: false, reason: 'not_member' };
    return valid(userId, code) ? { ok: true, userId, method: 'qr' } : { ok: false, reason: 'invalid' };
  }
  const code = (input.code ?? '').replace(/\D/g, '');
  if (code.length !== 6) return { ok: false, reason: 'format' };
  const userId = group.memberIds.find((uid) => valid(uid, code));
  return userId ? { ok: true, userId, method: 'code' } : { ok: false, reason: 'invalid' };
}

/**
 * Close check-in: arrivals earn reliability; absences become no-show strikes
 * only when at least two people were confirmed (so one person cannot mark a
 * whole group absent).
 */
export function settleCheckIn(
  group: { id: string; eventId: string; memberIds: string[] },
  checkIns: Record<string, CheckInRecord>,
  now: number,
  newId: (i: number) => string = (i) => `st_${group.id}_${now}_${i}`,
): { strikes: Strike[]; rewards: Record<string, number>; counted: boolean } {
  const arrived = group.memberIds.filter((m) => checkIns[m]);
  const absent = group.memberIds.filter((m) => !checkIns[m]);
  const counted = arrived.length >= 2;
  const at = new Date(now).toISOString();
  const rewards: Record<string, number> = Object.fromEntries(arrived.map((m) => [m, ATTENDED_RELIABILITY]));
  const strikes: Strike[] = counted
    ? absent.map((userId, i) => ({
        id: newId(i),
        userId,
        kind: 'no_show',
        at,
        groupId: group.id,
        eventId: group.eventId,
        reliabilityDelta: STRIKE_RELIABILITY.no_show,
      }))
    : [];
  for (const s of strikes) rewards[s.userId] = (rewards[s.userId] ?? 0) + s.reliabilityDelta;
  return { strikes, rewards, counted };
}
