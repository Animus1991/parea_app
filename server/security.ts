/**
 * Server hardening helpers (audit 2026-11-14, §4 Critical/High).
 *
 * Pure functions so they can be unit-tested without starting Express.
 * This is defence in depth for a demo SPA backend: there are no user
 * sessions yet, so these rules limit abuse (cross-site calls, quota burn,
 * catalog poisoning, spoofed chat senders) rather than authenticate people.
 */

/* ───────────────────────── origins (CORS / Socket.IO) ───────────────────────── */

export interface OriginPolicy {
  /** Explicit allowlist from ALLOWED_ORIGINS (comma separated, exact origins). */
  allowed: string[];
  /** Development mode also accepts any localhost / 127.0.0.1 port. */
  isProduction: boolean;
}

export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter((s) => /^https?:\/\/[^\s/]+$/i.test(s));
}

/**
 * Same-origin requests are always allowed (the SPA is served by this server).
 * Cross-origin callers must be on the allowlist; in development any
 * localhost port is accepted so a separate Vite dev server keeps working.
 * Requests without an Origin header (curl, server-to-server, same-origin GET)
 * are not browser cross-site requests and pass through.
 */
export function isOriginAllowed(origin: string | undefined, host: string | undefined, policy: OriginPolicy): boolean {
  if (!origin) return true;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (host && parsed.host === host) return true;
  if (policy.allowed.includes(parsed.origin)) return true;
  if (!policy.isProduction && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) return true;
  return false;
}

/* ───────────────────────── event writes ───────────────────────── */

export type EventsWriteMode = 'open' | 'token' | 'closed';

/**
 * Who may write to the shared events catalog.
 * - EVENTS_WRITE_TOKEN set → only requests with `Authorization: Bearer <token>`.
 * - EVENTS_WRITE_MODE=open → anyone (explicit opt-in, e.g. a throwaway demo).
 * - otherwise: open in development, closed in production.
 * The SPA keeps working when writes are rejected: it saves events locally
 * and the API call is fire-and-forget.
 */
export function eventsWriteMode(env: { EVENTS_WRITE_TOKEN?: string; EVENTS_WRITE_MODE?: string }, isProduction: boolean): EventsWriteMode {
  if (env.EVENTS_WRITE_TOKEN && env.EVENTS_WRITE_TOKEN.length >= 16) return 'token';
  if (env.EVENTS_WRITE_MODE === 'open') return 'open';
  return isProduction ? 'closed' : 'open';
}

/** Constant-time comparison of a bearer token. */
export function bearerMatches(header: string | undefined, token: string): boolean {
  const m = /^Bearer\s+(.+)$/i.exec(header ?? '');
  if (!m) return false;
  const given = m[1].trim();
  if (given.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i += 1) diff |= given.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

/** Only absolute https URLs (or empty) are kept for links and images. */
export function safeHttpsUrl(value: unknown, maxLen = 2048): string | undefined {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLen) return undefined;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const SAFETY_LEVELS = ['low', 'medium', 'high_trust'] as const;
const TRUST_TIERS = ['1_explorer', '2_confirmed', '3_high_trust'] as const;
const STATUSES = ['active', 'cancelled', 'archived'] as const;

type Sanitized = Record<string, unknown>;

export interface SanitizeResult {
  ok: boolean;
  value: Sanitized;
  errors: string[];
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s && s.length <= max ? s : undefined;
}

function num(v: unknown, min: number, max: number): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
}

/**
 * Whitelists event fields with type, length and range checks. Unknown keys
 * are dropped (no prototype or payload smuggling into the stored JSON).
 * `partial` is used for PUT: only provided, valid fields are returned.
 */
export function sanitizeEventInput(body: unknown, partial: boolean): SanitizeResult {
  const errors: string[] = [];
  const out: Sanitized = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, value: {}, errors: ['body must be an object'] };
  }
  const b = body as Record<string, unknown>;
  const put = (key: string, value: unknown, invalid: boolean) => {
    if (b[key] === undefined) return;
    if (invalid) errors.push(`invalid ${key}`);
    else out[key] = value;
  };

  const title = str(b.title, 140);
  put('title', title, !title);
  const category = str(b.category, 60);
  put('category', category, !category);
  const description = typeof b.description === 'string' && b.description.length <= 4000 ? b.description : undefined;
  put('description', description, description === undefined);
  const date = typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : undefined;
  put('date', date, !date);
  const time = typeof b.time === 'string' && /^\d{2}:\d{2}$/.test(b.time) ? b.time : undefined;
  put('time', time, !time);
  for (const key of ['timeZone', 'duration', 'locationArea', 'exactLocation', 'organizerId'] as const) {
    const v = str(b[key], key === 'exactLocation' ? 200 : 120);
    put(key, v, !v);
  }
  put('isPaid', b.isPaid, typeof b.isPaid !== 'boolean');
  const price = num(b.price, 0, 10_000);
  put('price', price, price === undefined);
  const lat = num(b.lat, -90, 90);
  put('lat', lat, lat === undefined);
  const lng = num(b.lng, -180, 180);
  put('lng', lng, lng === undefined);
  const maxP = num(b.maxParticipants, 1, 500);
  put('maxParticipants', maxP, maxP === undefined);
  const curP = num(b.currentParticipants, 0, 500);
  put('currentParticipants', curP, curP === undefined);
  put('safetyLevel', b.safetyLevel, !(SAFETY_LEVELS as readonly unknown[]).includes(b.safetyLevel));
  put('minTrustTierAccess', b.minTrustTierAccess, !(TRUST_TIERS as readonly unknown[]).includes(b.minTrustTierAccess));
  put('status', b.status, !(STATUSES as readonly unknown[]).includes(b.status));
  put('isTrending', b.isTrending, typeof b.isTrending !== 'boolean');
  put('isPlatformEvent', b.isPlatformEvent, typeof b.isPlatformEvent !== 'boolean');
  if (b.tags !== undefined) {
    const tags = Array.isArray(b.tags) ? b.tags.filter((t) => typeof t === 'string' && t.length <= 40).slice(0, 12) : null;
    if (!tags) errors.push('invalid tags');
    else out.tags = tags;
  }
  if (b.groupDiscount !== undefined) {
    const g = b.groupDiscount as Record<string, unknown> | null;
    const minSize = num(g?.minSize, 2, 50);
    const percentage = num(g?.percentage, 1, 90);
    if (minSize === undefined || percentage === undefined) errors.push('invalid groupDiscount');
    else out.groupDiscount = { minSize, percentage };
  }
  // Non-https links are dropped, not rejected: a locally previewed upload is a
  // blob: URL that means nothing on the server, and the rest of the event is fine.
  for (const key of ['imageUrl', 'externalLink'] as const) {
    const url = safeHttpsUrl(b[key]);
    if (url) out[key] = url;
  }

  if (!partial) {
    for (const required of ['title', 'category', 'date', 'time']) {
      if (out[required] === undefined && !errors.includes(`invalid ${required}`)) errors.push(`${required} is required`);
    }
  }
  return { ok: errors.length === 0, value: out, errors };
}

/* ───────────────────────── AI proxy ───────────────────────── */

/** Models the proxy may call; the client can no longer pick an arbitrary model. */
export function allowedModels(env: { GEMINI_MODEL?: string; GEMINI_TEXT_MODEL?: string }): { copilot: string; text: string } {
  const copilot = env.GEMINI_MODEL || 'gemini-2.5-flash';
  return { copilot, text: env.GEMINI_TEXT_MODEL || copilot };
}

export function isValidToolDeclaration(tool: unknown): boolean {
  if (!tool || typeof tool !== 'object') return false;
  const t = tool as Record<string, unknown>;
  return (
    typeof t.name === 'string' &&
    /^[a-z_][a-z0-9_]{0,63}$/.test(t.name) &&
    typeof t.description === 'string' &&
    t.description.length <= 1000 &&
    (t.parameters === undefined || (typeof t.parameters === 'object' && t.parameters !== null))
  );
}

/* ───────────────────────── rate limiting ───────────────────────── */

/** Fixed-window limiter with bounded memory (old buckets are pruned). */
export class RateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  /** Returns the retry delay in ms when over the limit, else null. */
  hit(key: string, now = Date.now()): number | null {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (this.buckets.size >= this.maxKeys) this.prune(now);
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return null;
    }
    bucket.count += 1;
    return bucket.count > this.limit ? bucket.resetAt - now : null;
  }

  private prune(now: number): void {
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
    // Still full (sustained flood): drop the oldest entries.
    if (this.buckets.size >= this.maxKeys) {
      const drop = Math.ceil(this.maxKeys / 10);
      let i = 0;
      for (const k of this.buckets.keys()) {
        if (i++ >= drop) break;
        this.buckets.delete(k);
      }
    }
  }
}

/* ───────────────────────── realtime chat ───────────────────────── */

export const CHAT_ID_PATTERN = /^[A-Za-z0-9:_-]{1,128}$/;

export interface ChatSendCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Join a chat room only with a known identity, a valid id, and (when a
 * membership lookup is provided) proven membership of that conversation.
 */
export function checkChatJoin(
  conversationId: unknown,
  socketUserId: string | undefined,
  joinedRooms: Set<string>,
  memberOf?: (conversationId: string, userId: string) => boolean,
): ChatSendCheck {
  if (typeof conversationId !== 'string' || !CHAT_ID_PATTERN.test(conversationId)) {
    return { ok: false, reason: 'conversation' };
  }
  if (!socketUserId) return { ok: false, reason: 'identity' };
  if (joinedRooms.size >= 200) return { ok: false, reason: 'limit' };
  if (memberOf && !memberOf(conversationId, socketUserId)) {
    return { ok: false, reason: 'membership' };
  }
  return { ok: true };
}

/**
 * A socket may only send as the identity it connected with, only into a room
 * it joined, and only reasonably sized text.
 */
export function checkChatSend(
  data: unknown,
  socketUserId: string | undefined,
  joinedRooms: Set<string>,
): ChatSendCheck {
  if (!data || typeof data !== 'object') return { ok: false, reason: 'payload' };
  const d = data as Record<string, unknown>;
  if (typeof d.conversationId !== 'string' || !CHAT_ID_PATTERN.test(d.conversationId)) return { ok: false, reason: 'conversation' };
  if (typeof d.body !== 'string' || !d.body.trim() || d.body.length > 2000) return { ok: false, reason: 'body' };
  if (!socketUserId || d.senderId !== socketUserId) return { ok: false, reason: 'sender' };
  if (!joinedRooms.has(d.conversationId)) return { ok: false, reason: 'room' };
  return { ok: true };
}

/* ───────────────────────── response headers ───────────────────────── */

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  // Microphone is used by the copilot's voice input; geolocation by maps;
  // the camera (own origin only) by the door check-in scanner and the selfie check.
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
  // Google sign-in opens a popup, so popups keep their opener.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
};

/* ───────────────────────── Φ27 — embeds & calendar feeds ───────────────────────── */

/** Read-only pages an organizer may put on their own site (every link opens a new tab). */
export function isEmbeddablePath(pathname: string): boolean {
  return /^\/embed\/organizer\/[^/]+$/.test(pathname);
}

/**
 * Headers for one response: embeddable pages may be framed by any site
 * (frame-ancestors *, no X-Frame-Options); everything else keeps DENY/'none'.
 * The camera is never offered inside a frame.
 */
export function headersForPath(pathname: string, base: Record<string, string> = SECURITY_HEADERS): Record<string, string> {
  if (!isEmbeddablePath(pathname)) return base;
  const { 'X-Frame-Options': _deny, ...rest } = base;
  return { ...rest, 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
}

export function cspForPath(csp: string, pathname: string): string {
  return isEmbeddablePath(pathname) ? csp.replace("frame-ancestors 'none'", 'frame-ancestors *') : csp;
}

/** `org1.ics` → `org1`; anything else → null. */
export function parseCalendarFeedId(file: string): string | null {
  const m = /^([A-Za-z0-9_-]{1,64})\.ics$/.exec(file);
  return m ? m[1] : null;
}
