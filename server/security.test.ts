// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  RateLimiter,
  bearerMatches,
  checkChatSend,
  eventsWriteMode,
  isOriginAllowed,
  isValidToolDeclaration,
  parseAllowedOrigins,
  safeHttpsUrl,
  sanitizeEventInput,
} from './security';

const dev = { allowed: [], isProduction: false };
const prod = { allowed: ['https://nakamas.example.org'], isProduction: true };

describe('origin policy', () => {
  it('allows same-origin and no-origin requests', () => {
    expect(isOriginAllowed(undefined, 'app.example.org', prod)).toBe(true);
    expect(isOriginAllowed('https://app.example.org', 'app.example.org', prod)).toBe(true);
  });
  it('allows the allowlist and localhost only in development', () => {
    expect(isOriginAllowed('https://nakamas.example.org', 'api.example.org', prod)).toBe(true);
    expect(isOriginAllowed('http://localhost:5173', 'api.example.org', prod)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173', 'localhost:3000', dev)).toBe(true);
    expect(isOriginAllowed('https://evil.example', 'localhost:3000', dev)).toBe(false);
    expect(isOriginAllowed('not a url', 'localhost:3000', dev)).toBe(false);
  });
  it('parses ALLOWED_ORIGINS strictly', () => {
    expect(parseAllowedOrigins(' https://a.example/ ,javascript:alert(1), http://b.example:8080')).toEqual([
      'https://a.example',
      'http://b.example:8080',
    ]);
  });
});

describe('event writes', () => {
  it('is closed in production unless a token or explicit open mode is set', () => {
    expect(eventsWriteMode({}, true)).toBe('closed');
    expect(eventsWriteMode({}, false)).toBe('open');
    expect(eventsWriteMode({ EVENTS_WRITE_MODE: 'open' }, true)).toBe('open');
    expect(eventsWriteMode({ EVENTS_WRITE_TOKEN: 'short' }, true)).toBe('closed');
    expect(eventsWriteMode({ EVENTS_WRITE_TOKEN: 'a-long-enough-secret' }, true)).toBe('token');
  });
  it('compares bearer tokens exactly', () => {
    expect(bearerMatches('Bearer a-long-enough-secret', 'a-long-enough-secret')).toBe(true);
    expect(bearerMatches('Bearer a-long-enough-secreT', 'a-long-enough-secret')).toBe(false);
    expect(bearerMatches(undefined, 'a-long-enough-secret')).toBe(false);
  });
  it('whitelists fields and validates types', () => {
    const r = sanitizeEventInput(
      {
        title: 'Hike',
        category: 'Hiking',
        date: '2026-12-01',
        time: '09:00',
        price: 0,
        isPaid: false,
        __proto__: { polluted: true },
        isOrganizerOverride: true,
        imageUrl: 'blob:http://localhost/123',
        externalLink: 'https://tickets.example/x',
      },
      false,
    );
    expect(r.ok).toBe(true);
    expect(r.value).not.toHaveProperty('isOrganizerOverride');
    expect(r.value).not.toHaveProperty('imageUrl');
    expect(r.value.externalLink).toBe('https://tickets.example/x');
  });
  it('rejects bad values and missing required fields', () => {
    expect(sanitizeEventInput({ title: 'x', category: 'y', date: '01/12/2026', time: '9' }, false).ok).toBe(false);
    expect(sanitizeEventInput({ title: 'x' }, false).errors).toContain('category is required');
    expect(sanitizeEventInput({ price: -5 }, true).ok).toBe(false);
    expect(sanitizeEventInput({ status: 'cancelled' }, true)).toMatchObject({ ok: true, value: { status: 'cancelled' } });
    expect(sanitizeEventInput([], true).ok).toBe(false);
  });
  it('keeps only https links', () => {
    expect(safeHttpsUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpsUrl('http://plain.example')).toBeUndefined();
    expect(safeHttpsUrl('https://ok.example/a')).toBe('https://ok.example/a');
  });
});

describe('AI proxy and chat', () => {
  it('validates tool declarations', () => {
    expect(isValidToolDeclaration({ name: 'search_events', description: 'Search' })).toBe(true);
    expect(isValidToolDeclaration({ name: 'Bad Name', description: 'x' })).toBe(false);
    expect(isValidToolDeclaration(null)).toBe(false);
  });
  it('rate limits per key and frees memory', () => {
    const rl = new RateLimiter(2, 1000, 3);
    expect(rl.hit('a', 0)).toBeNull();
    expect(rl.hit('a', 10)).toBeNull();
    expect(rl.hit('a', 20)).toBe(980);
    expect(rl.hit('a', 1000)).toBeNull();
    for (const k of ['b', 'c', 'd', 'e']) rl.hit(k, 2000);
  });
  it('only lets a socket send as itself into a joined room', () => {
    const rooms = new Set(['conv_1']);
    expect(checkChatSend({ conversationId: 'conv_1', senderId: 'u1', body: 'hi' }, 'u1', rooms).ok).toBe(true);
    expect(checkChatSend({ conversationId: 'conv_1', senderId: 'u2', body: 'hi' }, 'u1', rooms).reason).toBe('sender');
    expect(checkChatSend({ conversationId: 'conv_2', senderId: 'u1', body: 'hi' }, 'u1', rooms).reason).toBe('room');
    expect(checkChatSend({ conversationId: 'conv_1', senderId: 'u1', body: 'x'.repeat(2001) }, 'u1', rooms).reason).toBe('body');
  });
});

describe('embeds & calendar feeds (Φ27)', () => {
  it('lets only the organizer widget be framed, without device access', async () => {
    const { headersForPath, cspForPath, isEmbeddablePath, SECURITY_HEADERS } = await import('./security');
    expect(isEmbeddablePath('/embed/organizer/org1')).toBe(true);
    expect(isEmbeddablePath('/embed/organizer/org1/x')).toBe(false);
    expect(isEmbeddablePath('/events/e1')).toBe(false);
    expect(headersForPath('/events/e1')['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=(self)');
    const embed = headersForPath('/embed/organizer/org1');
    expect(embed['X-Frame-Options']).toBeUndefined();
    expect(embed['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(cspForPath("default-src 'self'; frame-ancestors 'none'", '/embed/organizer/org1')).toContain('frame-ancestors *');
    expect(cspForPath("default-src 'self'; frame-ancestors 'none'", '/plans')).toContain("frame-ancestors 'none'");
  });

  it('accepts only simple ids for .ics feeds', async () => {
    const { parseCalendarFeedId } = await import('./security');
    expect(parseCalendarFeedId('org1.ics')).toBe('org1');
    expect(parseCalendarFeedId('platform.ics')).toBe('platform');
    expect(parseCalendarFeedId('../etc.ics')).toBeNull();
    expect(parseCalendarFeedId('org1')).toBeNull();
    expect(parseCalendarFeedId('a'.repeat(65) + '.ics')).toBeNull();
  });
});
