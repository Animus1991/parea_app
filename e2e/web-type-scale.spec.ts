import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Desktop web type scale', () => {
  test('cards grow more than page chrome, and phones stay compact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    await expect(page.getByText('Φόρτωση…')).toHaveCount(0);
    const title = page.locator('#main-content .nakamas-card h3').first();
    await expect(title).toBeVisible({ timeout: 15_000 });

    const phone = await page.evaluate(() => {
      const html = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const card = document.querySelector('#main-content .nakamas-card h3');
      return {
        html,
        card: card ? parseFloat(getComputedStyle(card).fontSize) : 0,
      };
    });
    expect(phone.html).toBeCloseTo(16, 0);
    expect(phone.card).toBeGreaterThan(10);
    expect(phone.card).toBeLessThan(12.2);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(title).toBeVisible();
    const desktop = await page.evaluate(() => {
      const html = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const card = document.querySelector('#main-content .nakamas-card h3');
      return {
        html,
        card: card ? parseFloat(getComputedStyle(card).fontSize) : 0,
      };
    });
    expect(desktop.html).toBeCloseTo(17.6, 1);
    expect(desktop.card / phone.card).toBeGreaterThan(1.2);
    expect(desktop.card / phone.card).toBeLessThan(1.32);
    expect(desktop.html / phone.html).toBeGreaterThan(1.08);
    expect(desktop.html / phone.html).toBeLessThan(1.13);
  });
});
