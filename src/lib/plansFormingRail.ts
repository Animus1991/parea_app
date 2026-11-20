/**
 * Where the «Βρες Nakamas» right rail is shown (UX declutter, 14/11/2026).
 *
 * The rail is about finding company for events, so it appears on discovery
 * surfaces only. Account, settings, chat and admin screens stay focused on
 * their own task, and /buddy-seek already shows the same list full-width.
 * Everything in the rail stays reachable from «Βρες Nakamas» in the nav.
 */
const EXACT = new Set(['/', '/categories', '/saved', '/collections']);

export function isPlansRailRoute(pathname: string): boolean {
  if (EXACT.has(pathname)) return true;
  // Collections are discovery too.
  if (/^\/collections\/[^/]+$/.test(pathname)) return true;
  // The join flow keeps the rail. The event page itself does not: it has its own
  // «Αναζήτηση Nakamas» panel, and the rail squeezed it to ~200px (declutter, Φ28).
  return /^\/events\/[^/]+\/join$/.test(pathname);
}
