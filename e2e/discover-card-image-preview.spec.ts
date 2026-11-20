import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Discover card image preview', () => {
  test('first three feed cards try title, facts, organizer; the rest stay photo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    const depths = page.locator('#main-content .nakamas-card [data-image-depth]');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    await expect(depths.nth(0)).toHaveAttribute('data-image-depth', 'title');
    await expect(depths.nth(1)).toHaveAttribute('data-image-depth', 'facts');
    await expect(depths.nth(2)).toHaveAttribute('data-image-depth', 'organizer');
    await expect(depths.nth(3)).toHaveAttribute('data-image-depth', 'photo');
  });
});
