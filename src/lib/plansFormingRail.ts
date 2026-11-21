/**
 * Where the «Βρες Nakamas» right rail is shown (UX declutter, 14/11/2026).
 *
 * The rail is about finding company for events, so it appears on discovery
 * surfaces only. Account, settings, chat and admin screens stay focused on
 * their own task, and /buddy-seek already shows the same list full-width.
 * Everything in the rail stays reachable from «Βρες Nakamas» in the nav.
 */
// Home only (declutter, 20/11/2026): other pages link to «Βρες Nakamas» from the nav.
const EXACT = new Set(['/']);

export function isPlansRailRoute(pathname: string): boolean {
  return EXACT.has(pathname);
}

/**
 * Overlay = last-minute nearby outings. My Plans already lists booked nights,
 * so do not stack a second copy there. Find Nakamas is event company only.
 */
export function hidesFindCompanyShortcut(pathname: string): boolean {
  return pathname === '/plans' || pathname.startsWith('/plans/');
}
