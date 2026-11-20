/**
 * Per-device «Αργότερα» for reminders and tips (declutter): a hidden hint
 * comes back after N days, so nothing is lost for good. Storage failures
 * (private mode, blocked site data) simply show the hint again.
 */
export function snooze(key: string, days: number, now = Date.now()): void {
  try {
    localStorage.setItem(key, String(now + days * 86_400_000));
  } catch {
    /* storage unavailable — the hint will show again */
  }
}

export function isSnoozed(key: string, now = Date.now()): boolean {
  try {
    const until = Number(localStorage.getItem(key));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

export function unsnooze(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}
