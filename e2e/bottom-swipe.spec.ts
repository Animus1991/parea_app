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

  test('edit can pin a page onto the bar and add a hidden page to the swipe menu', async ({ page }) => {
    await enterDemoGuest(page);
    const tab = page.getByRole('link', { name: /^Ανακάλυψη$|^Discover$/ });
    const tabBox = await tab.boundingBox();
    await swipe(page, { x: tabBox!.x + tabBox!.width / 2, y: tabBox!.y + tabBox!.height / 2 }, -80);

    const sheet = page.getByRole('dialog', { name: /Γρήγορη πρόσβαση|Quick access|Επεξεργασία συντομεύσεων|Edit shortcuts/ });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: /^Επεξεργασία$|^Edit$/ }).click();
    await expect(sheet.getByRole('heading', { name: /Επεξεργασία συντομεύσεων|Edit shortcuts/ })).toBeVisible({ timeout: 8_000 });

    await sheet.getByRole('button', { name: /Στην κάτω μπάρα|Pin to the bar/ }).first().click();
    await sheet.getByRole('button', { name: /Προσθήκη: Αναφορά|Add Report/ }).click();
    await sheet.getByRole('button', { name: /^Έτοιμο$|^Done$/ }).click();

    const bar = page.locator('[data-bottom-swipe-origin]');
    await expect(bar.getByRole('link', { name: /^Κατηγορίες$|^Categories$/ })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /^Αναφορά$|^Report$/ })).toBeVisible();
  });

  test('browse Add opens edit, extra pages can join the menu, and extras can be removed', async ({ page }) => {
    await enterDemoGuest(page);
    const tab = page.getByRole('link', { name: /^Ανακάλυψη$|^Discover$/ });
    const tabBox = await tab.boundingBox();
    await swipe(page, { x: tabBox!.x + tabBox!.width / 2, y: tabBox!.y + tabBox!.height / 2 }, -80);

    const sheet = page.getByRole('dialog', { name: /Γρήγορη πρόσβαση|Quick access|Επεξεργασία συντομεύσεων|Edit shortcuts/ });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: /^Προσθήκη$|^Add$/ }).click();
    await expect(sheet.getByRole('heading', { name: /Κι άλλες λειτουργίες|More pages/ })).toBeVisible();

    await sheet.getByRole('button', { name: /Προσθήκη: Επιτεύγματα|Add Achievements/ }).click();
    await sheet.getByRole('button', { name: /^Έτοιμο$|^Done$/ }).click();
    await expect(sheet.getByRole('link', { name: /^Επιτεύγματα$|^Achievements$/ })).toBeVisible();

    await sheet.getByRole('button', { name: /^Επεξεργασία$|^Edit$/ }).click();
    const before = await sheet.getByRole('button', { name: /^Αφαίρεση$|^Remove$/ }).count();
    await sheet.getByRole('button', { name: /^Αφαίρεση$|^Remove$/ }).last().click();
    await expect(sheet.getByRole('button', { name: /^Αφαίρεση$|^Remove$/ })).toHaveCount(before - 1);
  });
});
