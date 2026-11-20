/**
 * Content-Security-Policy, shared by the Express server (server.ts) and the
 * static build (vite.config.ts writes it into dist/_headers).
 *
 * Inventory of what the app loads (audit 2026-11-14):
 * - scripts: own bundle; Google Identity Services and Firebase Auth helpers
 * - styles: own CSS, inline <style> in a few components, Google Fonts CSS
 * - fonts: Google Fonts files
 * - images: event and avatar photos from many https hosts, map tiles, data/blob
 * - connect: own API and socket, Firebase / Google APIs, Ticketmaster, plus the
 *   configured API base and WebSocket URL when they live on another origin
 * - frames: Google sign-in and the Firebase Auth helper iframe
 */

export type CspMode = 'enforce' | 'report-only' | 'off';

export interface CspEnv {
  CSP_MODE?: string;
  /** Extra space-separated sources for connect-src (e.g. an analytics endpoint). */
  CSP_CONNECT_SRC?: string;
  VITE_API_BASE_URL?: string;
  VITE_WS_URL?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_AUTH_DOMAIN?: string;
}

export function cspMode(env: CspEnv): CspMode {
  const raw = (env.CSP_MODE ?? '').trim().toLowerCase();
  if (raw === 'off' || raw === 'report-only') return raw;
  return 'enforce';
}

export function cspHeaderName(mode: CspMode): string | null {
  if (mode === 'off') return null;
  return mode === 'report-only' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
}

/** Origin of an absolute http(s)/ws(s) URL, or null for relative/invalid values. */
export function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

const SOURCE_PATTERN = /^(?:'self'|https:\/\/[a-z0-9.*-]+(?::\d+)?|wss:\/\/[a-z0-9.*-]+(?::\d+)?)$/i;

export function buildCsp(env: CspEnv, opts: { reportUri?: string } = {}): string {
  const extraConnect = [
    originOf(env.VITE_API_BASE_URL),
    originOf(env.VITE_WS_URL),
    ...(env.CSP_CONNECT_SRC ?? '').split(/\s+/).filter((s) => SOURCE_PATTERN.test(s)),
  ].filter((s): s is string => Boolean(s));
  // A socket on the API origin is reached with ws(s):// as well.
  for (const origin of [...extraConnect]) {
    if (origin.startsWith('https://')) extraConnect.push(origin.replace(/^https:/, 'wss:'));
  }
  const authDomain = (env.FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  const authOrigin = /^[a-z0-9.-]+$/i.test(authDomain) ? `https://${authDomain}` : null;

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://accounts.google.com', 'https://apis.google.com', 'https://www.gstatic.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'media-src': ["'self'", 'data:', 'blob:'],
    'connect-src': [
      "'self'",
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'wss://*.firebaseio.com',
      'https://*.firebaseapp.com',
      'https://accounts.google.com',
      'https://app.ticketmaster.com',
      'https://api.open-meteo.com',
      ...extraConnect,
    ],
    'frame-src': ['https://accounts.google.com', 'https://*.firebaseapp.com', ...(authOrigin ? [authOrigin] : [])],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${[...new Set(v)].join(' ')}`);
  if (opts.reportUri) parts.push(`report-uri ${opts.reportUri}`);
  return parts.join('; ');
}
