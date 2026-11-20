import { test, expect, type Page } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

const ALL_DEPTHS = ['photo', 'title', 'facts', 'organizer', 'roomy', 'divider', 'full'] as const;

/** The card-photo choice lives in Settings → Account (it is an appearance setting, not a feed filter). */
async function chooseDepth(page: Page, option: (typeof ALL_DEPTHS)[number]) {
  await page.goto('/settings');
  const picker = page.locator('[data-card-image-picker]');
  if (!(await picker.isVisible())) {
    await page.getByText(/Εικόνα κάρτας εκδήλωσης|Event card photo/).first().click();
  }
  await expect(picker).toBeVisible({ timeout: 15_000 });
  await picker.locator(`[data-card-image-option="${option}"]`).click();
  await expect(picker.locator(`[data-card-image-option="${option}"]`)).toHaveAttribute('aria-checked', 'true');
  await page.goto('/');
}

test.describe('Discover card image picker', () => {
  test('Discover stays quiet; Settings offers every depth and applies it to every card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    const depths = page.locator('#main-content .nakamas-card [data-image-depth]');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#main-content [data-card-image-picker]')).toHaveCount(0);

    await page.goto('/settings');
    await page.getByText(/Εικόνα κάρτας εκδήλωσης|Event card photo/).first().click();
    const picker = page.locator('[data-card-image-picker]');
    await expect(picker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    for (const option of ALL_DEPTHS) {
      await expect(picker.locator(`[data-card-image-option="${option}"]`)).toBeVisible();
    }

    await chooseDepth(page, 'divider');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    const count = await depths.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'divider');
    }
    await expect(depths.first().getByRole('progressbar')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await chooseDepth(page, 'organizer');
    await expect(depths.first()).toHaveAttribute('data-image-depth', 'organizer', { timeout: 15_000 });
    const organizerH = await depths.first().evaluate((el) => el.getBoundingClientRect().height);
    await chooseDepth(page, 'roomy');
    await expect(depths.first()).toHaveAttribute('data-image-depth', 'roomy', { timeout: 15_000 });
    const roomyH = await depths.first().evaluate((el) => el.getBoundingClientRect().height);
    expect(roomyH).toBeGreaterThan(organizerH + 24);
  });

  test('full photo fills the card; progress photo stops before the CTA', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterDemoGuest(page);
    await chooseDepth(page, 'full');
    const card = page.locator('#main-content .nakamas-card').first();
    await expect(card.locator('[data-image-depth]')).toHaveAttribute('data-image-depth', 'full', { timeout: 15_000 });
    const fullGap = await card.evaluate((el) => {
      const photo = el.querySelector('[data-image-depth]');
      if (!photo) return 99;
      return el.getBoundingClientRect().bottom - photo.getBoundingClientRect().bottom;
    });
    expect(fullGap).toBeLessThan(2);

    await chooseDepth(page, 'divider');
    const photo = page.locator('#main-content .nakamas-card').first().locator('[data-image-depth]');
    await expect(photo).toHaveAttribute('data-image-depth', 'divider', { timeout: 15_000 });
    await expect(photo.getByRole('progressbar')).toBeVisible();
    const cta = page.locator('#main-content .nakamas-card').first().getByRole('button', { name: /Βρες παρέα|Find company|Προβολή|View/ }).last();
    await expect(cta).toBeVisible();
    const ctaTop = await cta.evaluate((el) => el.getBoundingClientRect().top);
    const photoBottom = await photo.evaluate((el) => el.getBoundingClientRect().bottom);
    expect(ctaTop).toBeGreaterThan(photoBottom - 1);
  });
});
