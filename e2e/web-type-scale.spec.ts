import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Desktop web type scale', () => {
  test('cards grow more than page chrome, and phones stay compact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    await expect(page.getByText('Φόρτωση…')).toHaveCount(0);
    const title = page.locator('#main-content .nakamas-card h3').first();
    const story = page.locator('[data-event-story]').first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    await expect(story).toBeVisible({ timeout: 15_000 });

    const measure = () =>
      page.evaluate(() => {
        const html = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const card = document.querySelector('#main-content .nakamas-card h3');
        const tile = document.querySelector('[data-event-story]');
        const storyType = tile?.querySelector('.text-2xs');
        const caption = tile?.querySelector('[data-event-story-caption]');
        const section = document.querySelector('[data-event-stories] h2');
        const tileBox = tile?.getBoundingClientRect();
        const captionBox = caption?.getBoundingClientRect();
        return {
          html,
          card: card ? parseFloat(getComputedStyle(card).fontSize) : 0,
          story: storyType ? parseFloat(getComputedStyle(storyType).fontSize) : 0,
          section: section ? parseFloat(getComputedStyle(section).fontSize) : 0,
          tileW: tileBox?.width ?? 0,
          tileH: tileBox?.height ?? 0,
          captionShare: tileBox && captionBox && tileBox.height ? captionBox.height / tileBox.height : 0,
        };
      });

    const phone = await measure();
    expect(phone.html).toBeCloseTo(16, 0);
    expect(phone.card).toBeGreaterThan(10);
    expect(phone.card).toBeLessThan(12.2);
    // Phones: no word under 10px (round 23 raised text-2xs from 9px).
    expect(phone.story).toBeGreaterThanOrEqual(10);
    expect(phone.story).toBeLessThan(10.6);
    expect(phone.tileW).toBeGreaterThan(100);
    expect(phone.tileW).toBeLessThan(112);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(title).toBeVisible();
    await expect(story).toBeVisible();
    const desktop = await measure();
    expect(desktop.html).toBeCloseTo(17.6, 1);
    expect(desktop.card / phone.card).toBeGreaterThan(1.2);
    expect(desktop.card / phone.card).toBeLessThan(1.32);
    expect(desktop.html / phone.html).toBeGreaterThan(1.08);
    expect(desktop.html / phone.html).toBeLessThan(1.13);
    // Stories: html +10% and tile type +15.5% on the old 9px token (~11.4px).
    // Phone stories now sit on the 10px floor, so the desktop ratio is milder.
    expect(desktop.story / phone.story).toBeGreaterThan(1.10);
    expect(desktop.story / phone.story).toBeLessThan(1.20);
    expect(desktop.story / desktop.card).toBeLessThan(0.9);
    expect(desktop.tileW / phone.tileW).toBeGreaterThan(1.08);
    expect(desktop.tileW / phone.tileW).toBeLessThan(1.13);
    expect(desktop.captionShare).toBeLessThan(0.42);
    // Section label next to the rail stays on the chrome scale, not the tile boost.
    expect(desktop.section / phone.section).toBeGreaterThan(1.08);
    expect(desktop.section / phone.section).toBeLessThan(1.13);
  });
});
