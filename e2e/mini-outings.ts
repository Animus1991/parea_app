import type { Locator, Page } from '@playwright/test';

/** Pin a neighbourhood and widen to the week so last-minute filters show the demo coffee. */
export async function revealNearbyMiniOutings(root: Locator, place = 'koukaki') {
  const filters = root.locator('[data-mini-outing-filters]');
  await filters.locator(`[data-mini-place="${place}"]`).click();
  await filters.locator('[data-mini-when="week"]').click();
}

export async function openNearbyOutingsSheet(page: Page) {
  await page
    .getByRole('button', {
      name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/,
    })
    .click();
  return page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
}
