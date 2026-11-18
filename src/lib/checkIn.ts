/**
 * Check-in codes (Φ27, after DICE / Luma / Meetup). Each member's ticket shows
 * a QR and the same 6-digit code; both change every 30 seconds, so a
 * screenshot sent to someone else stops working.
 *
 * Demo note: the code is derived on the device. A real backend signs it with
 * a server secret (HMAC) — the payload format stays the same.
 */
export const CHECKIN_WINDOW_MS = 30_000;
const SALT = 'nakamas-checkin-v1';

/** FNV-1a 32-bit — tiny, deterministic, good enough to spread codes. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function checkInWindow(now: number): number {
  return Math.floor(now / CHECKIN_WINDOW_MS);
}

export function checkInCode(groupId: string, userId: string, window: number): string {
  return String(fnv1a(`${SALT}|${groupId}|${userId}|${window}`) % 1_000_000).padStart(6, '0');
}

export function currentCheckInCode(groupId: string, userId: string, now = Date.now()) {
  const window = checkInWindow(now);
  const msLeft = CHECKIN_WINDOW_MS - (now % CHECKIN_WINDOW_MS);
  return { code: checkInCode(groupId, userId, window), secondsLeft: Math.ceil(msLeft / 1000) };
}

/** What the QR encodes. */
export function checkInPayload(groupId: string, userId: string, code: string): string {
  return `NKM1:${groupId}:${userId}:${code}`;
}

export function parseCheckInPayload(raw: string): { groupId: string; userId: string; code: string } | null {
  const m = /^NKM1:([^:]+):([^:]+):(\d{6})$/.exec(raw.trim());
  return m ? { groupId: m[1], userId: m[2], code: m[3] } : null;
}

/**
 * Which member does this code belong to? Accepts the current and the
 * previous window, so a code read at the turn of the 30 s is still valid.
 */
export function matchCheckInCode(groupId: string, memberIds: string[], code: string, now = Date.now()): string | null {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 6) return null;
  const w = checkInWindow(now);
  for (const uid of memberIds) {
    if (checkInCode(groupId, uid, w) === clean || checkInCode(groupId, uid, w - 1) === clean) return uid;
  }
  return null;
}
