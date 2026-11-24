import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';
import { revealNearbyMiniOutings } from './mini-outings';

const ALL_DEPTHS = ['photo', 'title', 'facts', 'organizer', 'roomy', 'divider', 'full'] as const;

test.describe('Discover card image picker', () => {
  test('phone and web both offer every depth and apply the choice to every card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();

    const picker = page.locator('#main-content [data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#main-content .nakamas-card [data-image-depth]').first()).toHaveAttribute(
      'data-image-depth',
      'full',
    );
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
    const picker = page.locator('#main-content [data-card-image-picker]');
    await expect(picker).toBeVisible({ timeout: 15_000 });
    await picker.locator('[data-card-image-toggle]').click();
    const card = page.locator('#main-content .nakamas-card').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.locator('[data-image-depth]')).toHaveAttribute('data-image-depth', 'full');

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

  test('Plans and Find Nakamas reuse the same seven depths on card photos', async ({ page }) => {
    await enterDemoGuest(page);

    await page.goto('/plans');
    const plansPicker = page.locator('[data-card-image-picker]');
    await expect(plansPicker).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#main-content .nakamas-card [data-image-depth]').first()).toHaveAttribute(
      'data-image-depth',
      'full',
    );
    await plansPicker.locator('[data-card-image-toggle]').click();
    await expect(plansPicker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    await plansPicker.locator('[data-card-image-option="title"]').click();
    const plansCard = page.locator('#main-content .nakamas-card').first();
    const plansPhoto = plansCard.locator('[data-image-depth]');
    await expect(plansPhoto).toHaveAttribute('data-image-depth', 'title');
    await expect(plansCard.getByText(/· \d{1,2}:\d{2}/).first()).toBeVisible();
    await plansPicker.locator('[data-card-image-option="full"]').click();
    await expect(plansPhoto).toHaveAttribute('data-image-depth', 'full');
    // The photo itself opens the event (no separate Details button).
    await expect(plansPhoto.locator(':scope > button')).toHaveCount(1);
    await expect(plansCard.locator('h3 a').first()).toBeVisible();
    await expect(plansCard.getByRole('button', { name: /Αποχώρηση|Leave/ })).toBeVisible();
    await plansPicker.locator('[data-card-image-option="title"]').click();

    await page.goto('/buddy-seek');
    await expect(page.locator('#main-content').getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    const seekPicker = page.locator('[data-card-image-picker]');
    await expect(seekPicker).toBeVisible({ timeout: 15_000 });
    const seekPhoto = page.locator('#main-content [data-image-depth]').first();
    await expect(seekPhoto).toHaveAttribute('data-image-depth', 'title');
    await seekPicker.locator('[data-card-image-toggle]').click();
    await seekPicker.locator('[data-card-image-option="facts"]').click();
    await expect(page.locator('#main-content [data-image-depth]').first()).toHaveAttribute('data-image-depth', 'facts');
    await seekPicker.locator('[data-card-image-option="full"]').click();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/ }).click();
    const sheet = page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
    await expect(sheet).toBeVisible();
    await revealNearbyMiniOutings(sheet);
    const sheetPicker = sheet.locator('[data-card-image-picker]');
    await expect(sheetPicker).toBeVisible();
    await expect(sheet.locator('[data-image-depth]').first()).toHaveAttribute('data-image-depth', 'full');
    await sheetPicker.locator('[data-card-image-toggle]').click();
    await expect(sheetPicker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    await sheetPicker.locator('[data-card-image-option="photo"]').click();
    await expect(sheet.locator('[data-image-depth]').first()).toHaveAttribute('data-image-depth', 'photo');
  });

  test('suitcase sheet follows the card photo chosen on Discover without reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    const homePicker = page.locator('#main-content [data-card-image-picker]');
    await homePicker.locator('[data-card-image-toggle]').click();
    await homePicker.locator('[data-card-image-option="title"]').click();
    await expect(page.locator('#main-content .nakamas-card [data-image-depth]').first()).toHaveAttribute(
      'data-image-depth',
      'title',
    );

    await page.getByRole('button', { name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/ }).click();
    const sheet = page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
    await revealNearbyMiniOutings(sheet);
    await expect(sheet.locator('[data-image-depth]').first()).toHaveAttribute('data-image-depth', 'title');
    await sheet.locator('[data-card-image-toggle]').click();
    await sheet.locator('[data-card-image-option="photo"]').click();
    await expect(sheet.locator('[data-image-depth]').first()).toHaveAttribute('data-image-depth', 'photo');
    await sheet.getByRole('button', { name: /Κλείσιμο|Close/ }).last().click();
    await expect(page.locator('#main-content .nakamas-card [data-image-depth]').first()).toHaveAttribute(
      'data-image-depth',
      'photo',
    );
  });

  test('web right rail cards follow the same seven photo depths', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    const rail = page.getByRole('complementary', { name: /^Βρες Nakamas$|^Find Nakamas$/ });
    await expect(rail).toBeVisible({ timeout: 15_000 });
    const railPicker = rail.locator('[data-card-image-picker]');
    await expect(railPicker).toBeVisible();
    const railPhoto = rail.locator('.nakamas-card [data-image-depth]').first();
    await expect(railPhoto).toHaveAttribute('data-image-depth', 'full');

    await railPicker.locator('[data-card-image-toggle]').click();
    await expect(railPicker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
    for (const option of ALL_DEPTHS) {
      await expect(railPicker.locator(`[data-card-image-option="${option}"]`)).toBeVisible();
    }

    await railPicker.locator('[data-card-image-option="photo"]').click();
    await expect(railPhoto).toHaveAttribute('data-image-depth', 'photo');
    await railPicker.locator('[data-card-image-option="full"]').click();
    await expect(railPhoto).toHaveAttribute('data-image-depth', 'full');

    const homePicker = page.locator('#main-content [data-card-image-picker]');
    await homePicker.locator('[data-card-image-toggle]').click();
    await homePicker.locator('[data-card-image-option="facts"]').click();
    await expect(railPhoto).toHaveAttribute('data-image-depth', 'facts');
    await expect(page.locator('#main-content .nakamas-card [data-image-depth]').first()).toHaveAttribute(
      'data-image-depth',
      'facts',
    );
  });

  test('rail photo chips stay clickable over a Full card', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    const rail = page.getByRole('complementary', { name: /^Βρες Nakamas$|^Find Nakamas$/ });
    await expect(rail).toBeVisible({ timeout: 15_000 });
    const picker = rail.locator('[data-card-image-picker]');
    const toggle = picker.locator('[data-card-image-toggle]');
    await expect(toggle).toBeVisible();
    await rail.evaluate((el) => {
      el.scrollTop = 240;
    });
    await toggle.click();
    await expect(picker.getByRole('radio')).toHaveCount(ALL_DEPTHS.length);
  });

  test('Full cards keep hosting and Find Nakamas notes', async ({ page }) => {
    // Demo company requests sit on fixed dates; read the page before they pass.
    await page.clock.setFixedTime(new Date('2026-11-20T10:00:00+02:00'));
    await enterDemoGuest(page);
    const hostChip = page.getByRole('button', { name: /Χωρίς διοργανωτή|Seeking organizer/ });
    if (await hostChip.count()) {
      await hostChip.click();
      await expect(page.getByRole('button', { name: /Ανάλαβε τη διοργάνωση|Take on hosting/ }).first()).toBeVisible();
    }
    await page.goto('/buddy-seek');
    await expect(page.locator('#main-content [data-image-depth]').first()).toHaveAttribute('data-image-depth', 'full');
    await expect(page.getByText(/Φαγητό δρόμου με μικρή ομάδα|Street food with a small group/)).toBeVisible();
  });
});
