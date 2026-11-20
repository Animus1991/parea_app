import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Event tags', () => {
  test('Discover cards keep long tag labels fully visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.locator('#main-content .hero-search-field').fill('nakamas');
    const tag = page.locator('#main-content [data-event-tag="nakamas-nights"]').first();
    await expect(tag).toBeVisible({ timeout: 15_000 });
    await expect(tag).toHaveText(/Nakamas Nights/i);
    const fit = await tag.evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
      ellipsis: getComputedStyle(el).textOverflow,
    }));
    expect(fit.ellipsis).not.toBe('ellipsis');
    expect(fit.scroll).toBeLessThanOrEqual(fit.client + 1);
  });

  test('card chips show the full label and open the reusable tags index', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/collections/nakamas-nights');

    const tag = page.locator('[data-event-tag="nakamas-nights"]').first();
    await expect(tag).toBeVisible({ timeout: 15_000 });
    await expect(tag).toHaveText(/Nakamas Nights/i);

    const fit = await tag.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        scroll: el.scrollWidth,
        client: el.clientWidth,
        ellipsis: style.textOverflow,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      };
    });
    expect(fit.text).toMatch(/Nakamas Nights/i);
    expect(fit.ellipsis).not.toBe('ellipsis');
    expect(fit.scroll).toBeLessThanOrEqual(fit.client + 1);

    await tag.click();
    await expect(page).toHaveURL(/\/tags\/nakamas-nights$/);
    await expect(page.getByRole('heading', { level: 1, name: /Nakamas Nights/i })).toBeVisible();
    await expect(page.locator('#tag-events .nakamas-card')).not.toHaveCount(0);

    await page.getByRole('searchbox', { name: /Αναζήτηση ετικέτας|Search a tag/ }).fill('workshop');
    await page.getByRole('link', { name: /Εργαστήριο|Workshop/ }).first().click();
    await expect(page).toHaveURL(/\/tags\/workshop$/);
    await expect(page.getByRole('heading', { level: 1, name: /Εργαστήριο|workshop/i })).toBeVisible();
  });
});
