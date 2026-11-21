import { test, expect, type Page } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

async function swipe(page: Page, from: { x: number; y: number }, dy: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y + dy, { steps: 12 });
  await page.mouse.up();
}

function chatsButton(page: Page) {
  return page.getByRole('button', { name: /Συνομιλίες σχεδίων|Plan chats|αδιάβαστες συνομιλίες|unread chats/ });
}

test.describe('Nakamas Chat preview', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the floated straw hat opens and closes plan chats', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    await expect(btn.locator('svg[data-straw-hat="plan"]')).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('dialog', { name: /^Nakamas Chat$/ })).toBeVisible();
    await btn.click();
    await expect(page.getByRole('dialog', { name: /^Nakamas Chat$/ })).toHaveCount(0);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('swipe down on the sheet handle closes group chat preview', async ({ page }) => {
    await enterDemoGuest(page);
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(/Ομάδες|Groups/)).toBeVisible();

    const handle = sheet.locator('[data-chat-inbox-dismiss]');
    const box = await handle.boundingBox();
    expect(box).toBeTruthy();
    await swipe(page, { x: box!.x + box!.width / 2, y: box!.y + 10 }, 80);
    await expect(sheet).toHaveCount(0);
  });

  test('the close button still hides the preview', async ({ page }) => {
    await enterDemoGuest(page);
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Nakamas Chat desktop hat', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('floated straw hat opens and closes plan chats', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    await expect(btn.locator('svg[data-straw-hat="plan"]')).toBeVisible();
    await btn.click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await btn.click();
    await expect(sheet).toHaveCount(0);
  });
});
