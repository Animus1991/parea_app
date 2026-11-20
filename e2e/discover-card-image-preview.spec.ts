import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Discover card image picker', () => {
  test('phone offers three depths and applies the choice to every card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();

    const picker = page.locator('[data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    await expect(picker.getByRole('radio')).toHaveCount(3);
    await expect(picker.locator('[data-card-image-option="photo"]')).toBeVisible();
    await expect(picker.locator('[data-card-image-option="facts"]')).toBeVisible();
    await expect(picker.locator('[data-card-image-option="full"]')).toBeVisible();
    await expect(picker.locator('[data-card-image-option="title"]')).toHaveCount(0);

    const depths = page.locator('#main-content .nakamas-card [data-image-depth]');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    const count = await depths.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'photo');
    }

    await picker.locator('[data-card-image-option="facts"]').click();
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'facts');
    }

    await picker.locator('[data-card-image-option="full"]').click();
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'full');
    }
  });

  test('web offers six depths and applies the choice to every card', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();

    const picker = page.locator('[data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    await expect(picker.getByRole('radio')).toHaveCount(6);
    for (const option of ['photo', 'title', 'facts', 'organizer', 'divider', 'full']) {
      await expect(picker.locator(`[data-card-image-option="${option}"]`)).toBeVisible();
    }

    const depths = page.locator('#main-content .nakamas-card [data-image-depth]');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    const count = await depths.count();
    expect(count).toBeGreaterThan(1);

    await picker.locator('[data-card-image-option="organizer"]').click();
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'organizer');
    }

    await picker.locator('[data-card-image-option="divider"]').click();
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'divider');
    }
  });
});
