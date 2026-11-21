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

  test('the hat still toggles the inbox on a group-chat page', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/chat/g-nn1');
    const btn = chatsButton(page);
    await expect(btn).toBeVisible();
    await btn.click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await btn.click();
    await expect(sheet).toHaveCount(0);
  });

  test('opening a popup conversation hides the hat so Send stays tappable', async ({ page }) => {
    await enterDemoGuest(page);
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first().click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
    await expect(chatsButton(page)).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: /^Nakamas Chat$/ })).toHaveCount(0);
  });
});

test.describe('Nakamas Chat event page', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the event Join button stays tappable under the hat', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e1');
    const join = page.getByRole('button', { name: /Μπες σε παρέα|Join a group|Η βραδιά μας|Our night/ });
    await expect(join).toBeVisible();
    const box = await join.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width - 10, box!.y + box!.height / 2);
    await expect(page.getByRole('dialog', { name: /^Nakamas Chat$/ })).toHaveCount(0);
  });

  test('the hat still toggles chat above the event action bar', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e1');
    const btn = chatsButton(page);
    await expect(btn).toBeVisible();
    await btn.click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await btn.click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Nakamas Chat landscape', () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test('a conversation row stays tappable', async ({ page }) => {
    await enterDemoGuest(page);
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    const row = sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
  });

  test('close and the hat remain tappable', async ({ page }) => {
    await enterDemoGuest(page);
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ })).toBeVisible();
    await chatsButton(page).click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Nakamas Chat landscape desktop', () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test('group-chat inbox still shows a conversation row', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/chat/g-nn1');
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    const row = sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
  });
});

test.describe('Nakamas Chat short desktop', () => {
  test.use({ viewport: { width: 1024, height: 650 } });

  test('group-chat inbox close stays on screen', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/chat/g-nn1');
    await chatsButton(page).click();
    const sheet = page.getByRole('dialog', { name: /^Nakamas Chat$/ });
    await expect(sheet).toBeVisible();
    const close = sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ });
    await expect(close).toBeVisible();
    const box = await close.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    await close.click();
    await expect(sheet).toHaveCount(0);
  });
});
