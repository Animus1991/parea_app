import type { Locator } from '@playwright/test';

/** Pin a neighbourhood and widen to the week so last-minute filters show the demo coffee. */
export async function revealNearbyMiniOutings(root: Locator, place = 'koukaki') {
  const filters = root.locator('[data-mini-outing-filters]');
  await filters.locator(`[data-mini-place="${place}"]`).click();
  await filters.locator('[data-mini-when="week"]').click();
}
