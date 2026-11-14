const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|blob|about):/i;

/**
 * Returns an absolute http(s) URL that is safe to put in an `href`, or null.
 * Bare hosts such as "example.com/page" get https://. Any other scheme is rejected.
 */
export function safeExternalUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (BLOCKED_SCHEME.test(value)) return null;
  let candidate = value;
  if (value.startsWith('//')) candidate = `https:${value}`;
  else if (!value.includes('://')) candidate = `https://${value.replace(/^\/+/, '')}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** localStorage read that never throws (private mode, blocked storage). */
export function readStorage(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** localStorage write that never throws. Returns whether the value was stored. */
export function writeStorage(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
