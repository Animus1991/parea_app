import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('My Plans on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the next three plans are cards; the rest wait in a list and open into a card', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/plans');
    const main = page.locator('#main-content');
    await expect(main.locator('.nakamas-card [data-image-depth]')).toHaveCount(3, { timeout: 15_000 });

    const later = main.getByRole('region', { name: /Αργότερα|Later/ });
    const rows = later.getByRole('button');
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    const first = rows.first();
    const title = (await first.locator('span.truncate').first().innerText()).trim();
    await first.click();
    await expect(rows).toHaveCount(before - 1);
    await expect(main.locator('.nakamas-card [data-image-depth]')).toHaveCount(4);
    // The opened plan keeps every action of a full card.
    const card = main.locator('.nakamas-card').filter({ has: page.getByRole('button', { name: title, exact: true }) });
    await expect(card.getByRole('button', { name: /Αποχώρηση|Leave/ })).toBeVisible();
  });
});

test.describe('My Plans on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows every plan as a card', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/plans');
    const main = page.locator('#main-content');
    await expect(main.locator('.nakamas-card [data-image-depth]').first()).toBeVisible({ timeout: 15_000 });
    await expect(main.getByRole('region', { name: /Αργότερα|Later/ })).toHaveCount(0);
  });
});
