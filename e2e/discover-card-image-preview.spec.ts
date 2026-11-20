import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

const ALL_DEPTHS = ['photo', 'title', 'facts', 'organizer', 'roomy', 'divider', 'full'] as const;

test.describe('Discover card image picker', () => {
  test('phone and web both offer every depth and apply the choice to every card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();

    const picker = page.locator('[data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    // Collapsed to one quiet chip until opened.
    await expect(picker.getByRole('radio')).toHaveCount(0);
    await picker.locator('[data-card-image-toggle]').click();
    await expect(picker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    for (const option of ALL_DEPTHS) {
      await expect(picker.locator(`[data-card-image-option="${option}"]`)).toBeVisible();
    }

    const depths = page.locator('#main-content .nakamas-card [data-image-depth]');
    await expect(depths.first()).toBeVisible({ timeout: 15_000 });
    const count = await depths.count();
    expect(count).toBeGreaterThan(1);

    await picker.locator('[data-card-image-option="divider"]').click();
    for (let i = 0; i < count; i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'divider');
    }
    await expect(depths.first().getByRole('progressbar')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(picker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    await picker.locator('[data-card-image-option="organizer"]').click();
    for (let i = 0; i < (await depths.count()); i++) {
      await expect(depths.nth(i)).toHaveAttribute('data-image-depth', 'organizer');
    }
    const organizerH = await depths.first().evaluate((el) => el.getBoundingClientRect().height);
    await picker.locator('[data-card-image-option="roomy"]').click();
    await expect(depths.first()).toHaveAttribute('data-image-depth', 'roomy');
    const roomyH = await depths.first().evaluate((el) => el.getBoundingClientRect().height);
    expect(roomyH).toBeGreaterThan(organizerH + 24);
  });

  test('full photo fills the card; progress photo stops before the CTA', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterDemoGuest(page);
    const picker = page.locator('[data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    await picker.locator('[data-card-image-toggle]').click();
    const card = page.locator('#main-content .nakamas-card').first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await picker.locator('[data-card-image-option="full"]').click();
    const fullGap = await card.evaluate((el) => {
      const photo = el.querySelector('[data-image-depth]');
      if (!photo) return 99;
      return el.getBoundingClientRect().bottom - photo.getBoundingClientRect().bottom;
    });
    expect(fullGap).toBeLessThan(2);

    await picker.locator('[data-card-image-option="divider"]').click();
    const photo = card.locator('[data-image-depth]');
    await expect(photo).toHaveAttribute('data-image-depth', 'divider');
    await expect(photo.getByRole('progressbar')).toBeVisible();
    const cta = card.getByRole('button', { name: /Βρες παρέα|Find company|Προβολή|View/ }).last();
    await expect(cta).toBeVisible();
    const ctaTop = await cta.evaluate((el) => el.getBoundingClientRect().top);
    const photoBottom = await photo.evaluate((el) => el.getBoundingClientRect().bottom);
    expect(ctaTop).toBeGreaterThan(photoBottom - 1);
  });
});
