import { test, expect, type Page } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

async function swipe(page: Page, from: { x: number; y: number }, dy: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y + dy, { steps: 10 });
  await page.mouse.up();
}

test.describe('Bottom swipe quick nav', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('swipe down on the expanded sheet collapses it; the dimmed page does not start the gesture', async ({
    page,
  }) => {
    await enterDemoGuest(page);
    const tab = page.getByRole('link', { name: /^Ανακάλυψη$|^Discover$/ });
    await expect(tab).toBeVisible();
    const tabBox = await tab.boundingBox();
    expect(tabBox).toBeTruthy();
    await swipe(page, { x: tabBox!.x + tabBox!.width / 2, y: tabBox!.y + tabBox!.height / 2 }, -80);

    const sheet = page.locator('[data-bottom-swipe-sheet]');
    await expect(sheet).toBeVisible();
    await expect(page.getByRole('dialog', { name: /Γρήγορη πρόσβαση|Quick access/ })).toBeVisible();

    const sheetBox = await sheet.boundingBox();
    expect(sheetBox).toBeTruthy();
    await swipe(page, { x: sheetBox!.x + sheetBox!.width / 2, y: sheetBox!.y + 36 }, 80);
    await expect(sheet).toHaveCount(0);
  });
});
