import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Event card match chrome', () => {
  test('does not show a match-percentage control on Discover cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    const cards = page.locator('#main-content .nakamas-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await expect(cards.getByRole('button', { name: /ταίριασμα|match/i })).toHaveCount(0);
    await expect(cards.getByText(/^\d+%\s*(Ταίριασμα|Match)$/)).toHaveCount(0);
  });
});
