/**
 * Remembers the previous visit per user. The first page load of a browser
 * session freezes "previous visit" for the whole session (so the welcome-back
 * line stays stable while browsing) and records the new visit time.
 */
const LAST_KEY = 'nakamas-last-visit:';
const SESSION_KEY = 'nakamas-session-previous-visit:';

export function previousVisitAt(userId: string, now = Date.now()): number | null {
  try {
    const cached = window.sessionStorage.getItem(SESSION_KEY + userId);
    if (cached !== null) return cached === '' ? null : Number(cached);
    const last = window.localStorage.getItem(LAST_KEY + userId);
    const previous = last && Number.isFinite(Number(last)) ? Number(last) : null;
    window.sessionStorage.setItem(SESSION_KEY + userId, previous === null ? '' : String(previous));
    window.localStorage.setItem(LAST_KEY + userId, String(now));
    return previous;
  } catch {
    return null;
  }
}

/** Keep the stored visit time fresh while the app is open. */
export function touchVisit(userId: string, now = Date.now()): void {
  try {
    window.localStorage.setItem(LAST_KEY + userId, String(now));
  } catch {
    /* storage blocked: the line simply stays quiet */
  }
}
