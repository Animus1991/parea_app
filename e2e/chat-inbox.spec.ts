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

function inbox(page: Page) {
  return page.getByRole('dialog', { name: /^Nakamas Chat$/ });
}

async function openInbox(page: Page) {
  await chatsButton(page).click();
  const sheet = inbox(page);
  await expect(sheet).toBeVisible();
  return sheet;
}

test.describe('Nakamas Chat preview', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home shows only the selected chat hat, not the chooser', async ({ page }) => {
    await enterDemoGuest(page);
    await expect(chatsButton(page)).toBeVisible();
    await expect(page.getByRole('region', { name: /Επιλογή καπέλου συνομιλιών|Chat hat picker/ })).toHaveCount(0);
    await expect(page.getByText(/Πάτα ένα καπέλο|Tap a hat to try/)).toHaveCount(0);
  });

  test('settings chat hat choice becomes the chat button', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/settings?section=chat-icon');
    const chooser = page.getByRole('region', { name: /Επιλογή καπέλου συνομιλιών|Chat hat picker/ });
    await expect(chooser).toBeVisible();
    const hats = chooser.getByRole('radio', { name: /Επιλογή:|Choose:/ });
    expect(await hats.count()).toBeGreaterThan(8);
    await chooser.getByRole('radio', { name: /Επιλογή: Με λουρί|Choose: Chin strap/ }).click();
    await page.goto('/');
    await expect(page.getByRole('region', { name: /Επιλογή καπέλου συνομιλιών|Chat hat picker/ })).toHaveCount(0);
    await expect(chatsButton(page).locator('img[src="/chat-hats/12-chinstrap.png"]')).toBeVisible();
  });

  test('the chat hat can be dragged without opening, then tapped', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    const before = await btn.boundingBox();
    expect(before).toBeTruthy();
    const start = { x: before!.x + before!.width / 2, y: before!.y + before!.height / 2 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 90, start.y - 160, { steps: 12 });
    await page.mouse.up();
    await expect(inbox(page)).toHaveCount(0);
    const after = await btn.boundingBox();
    expect(after).toBeTruthy();
    expect(after!.x).toBeLessThan(before!.x - 40);
    expect(after!.y).toBeLessThan(before!.y - 40);
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('nakamas-ui');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored?.state?.chatHatPos?.nx).toBeGreaterThanOrEqual(0);
    expect(stored?.state?.chatHatPos?.nx).toBeLessThan(1);
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(inbox(page)).toBeVisible();
  });

  test('dragging the hat cannot cover Create event', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    const before = await btn.boundingBox();
    expect(before).toBeTruthy();
    const start = { x: before!.x + before!.width / 2, y: before!.y + before!.height / 2 };
    const viewport = page.viewportSize() ?? { width: 390, height: 844 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(viewport.width / 2, viewport.height - 20, { steps: 12 });
    await page.mouse.up();
    await expect(inbox(page)).toHaveCount(0);
    const after = await btn.boundingBox();
    expect(after).toBeTruthy();
    expect(after!.y + after!.height).toBeLessThanOrEqual(viewport.height - 75);
    const create = page.getByRole('link', { name: /Δημιουργία εκδήλωσης|Create event/ });
    await expect(create).toBeVisible();
    await create.click();
    await expect(page).toHaveURL(/\/create/);
    await expect(inbox(page)).toHaveCount(0);
  });

  test('the floated straw hat opens plan chats', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    await expect(btn.locator('svg[data-straw-hat="plan"]')).toBeVisible();
    await btn.click();
    const sheet = inbox(page);
    await expect(sheet).toBeVisible();
    await expect(chatsButton(page)).toHaveCount(0);
    const sheetBox = await sheet.boundingBox();
    expect(sheetBox).toBeTruthy();
    expect(sheetBox!.y + sheetBox!.height).toBeGreaterThan((page.viewportSize()?.height ?? 0) - 8);
    await expect(sheet.getByRole('button', { name: /Summer Cinema/ })).toBeVisible();
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
    await expect(chatsButton(page)).toBeVisible();
  });

  test('swipe down on the sheet handle closes group chat preview', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await expect(sheet.getByText(/Ομάδες|Groups/)).toBeVisible();

    const handle = sheet.locator('[data-chat-inbox-dismiss]');
    const box = await handle.boundingBox();
    expect(box).toBeTruthy();
    await swipe(page, { x: box!.x + box!.width / 2, y: box!.y + 10 }, 80);
    await expect(sheet).toHaveCount(0);
  });

  test('the close button still hides the preview', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
  });

  test('popup chat names the meeting point once and tucks extra actions', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Summer Cinema/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    const strip = win.locator('[data-chat-status-strip]');
    await expect(strip).toBeVisible();
    await expect(strip.getByText(/Σημείο συνάντησης|Meeting point/)).toHaveCount(1);
    await expect(strip.getByText(/20:30/)).toBeVisible();
    await expect(strip.getByRole('button', { name: /Ανακοίνωση άφιξης|Announce arrival/ })).toBeVisible();
    await expect(strip.getByRole('button', { name: /Άνοιγμα χάρτη|Open map/ })).toBeVisible();
    await expect(win.getByText(/Καρφιτσωμένο:|Pinned:/)).toHaveCount(0);
    await expect(win.getByRole('button', { name: /Φωνητική κλήση|Voice call/ })).toHaveCount(0);
    await win.getByRole('button', { name: /^Ενέργειες$|^Actions$/ }).click();
    await expect(win.getByRole('menuitem', { name: /Φωνητική κλήση|Voice call/ })).toBeVisible();
    await expect(win.getByRole('menuitem', { name: /Βιντεοκλήση|Video call/ })).toBeVisible();
    await win.getByRole('button', { name: /^Κλείσιμο μενού$|^Close menu$/ }).click();
    await expect(win.getByRole('button', { name: /Αντίδραση|React/ }).first()).toBeHidden();
    await win.locator('[data-message-id="m3"]').click();
    await expect(win.getByRole('button', { name: /Απάντηση|Reply/ }).first()).toBeVisible();

    await page.evaluate(() => {
      (window as Window & { __mapUrls?: string[] }).__mapUrls = [];
      window.open = ((url?: string | URL) => {
        (window as Window & { __mapUrls?: string[] }).__mapUrls?.push(String(url ?? ''));
        return null;
      }) as typeof window.open;
    });
    await strip.getByRole('button', { name: /Άνοιγμα χάρτη|Open map/ }).click();
    const mapUrls = await page.evaluate(() => (window as Window & { __mapUrls?: string[] }).__mapUrls ?? []);
    expect(mapUrls.join(' ')).toMatch(/Cine(\+|%20| )Thisio/);
    expect(mapUrls.join(' ')).not.toMatch(/Thisio(%2C|,)%20Athens/);
  });

  test('keyboard focus on a message reveals reply and react', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Summer Cinema/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    await win
      .locator('[data-message-id="m3"]')
      .getByRole('button', { name: /Ενέργειες μηνύματος|Message actions/ })
      .focus();
    await page.keyboard.press('Enter');
    await expect(win.getByRole('button', { name: /Απάντηση|Reply/ }).first()).toBeVisible();
    await expect(win.getByRole('button', { name: /Αντίδραση|React/ }).first()).toBeVisible();
  });

  test('a direct chat does not borrow the event venue as a meeting point', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Maria Τέλεια|Maria Great, see you/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    await expect(win.getByText(/Plateia Nerou|Σημείο συνάντησης|Meeting point/)).toHaveCount(0);
    await win.locator('[data-message-id="m4"]').click();
    await win.getByRole('button', { name: /Καρφίτσωμα|Pin/ }).click();
    await expect(win.getByText(/Καρφιτσωμένο:|Pinned:/)).toBeVisible();
  });

  test('the first mention chip stays tappable in a popup', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Summer Cinema/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    await win.getByRole('button', { name: /Περισσότερα|More tools/ }).click();
    await win.getByRole('button', { name: /^Αναφορά$|^Mention$/ }).click();
    const listbox = win.getByRole('listbox', { name: /Αναφορά χρήστη|Mention user/ });
    await expect(listbox).toBeVisible();
    const first = listbox.getByRole('button').first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    const label = ((await first.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    await first.click();
    await expect(win.getByRole('textbox', { name: /Σύνθεση μηνύματος|Compose message/ })).toHaveValue(
      new RegExp(`@${label.split(' ').pop()}`),
    );
  });
});

test.describe('Nakamas Chat desktop hat', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('floated straw hat opens plan chats', async ({ page }) => {
    await enterDemoGuest(page);
    const btn = chatsButton(page);
    await expect(btn.locator('svg[data-straw-hat="plan"]')).toBeVisible();
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
  });

  test('opening a popup conversation hides the hat', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first().click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
    await expect(chatsButton(page)).toHaveCount(0);
    await expect(inbox(page)).toHaveCount(0);
  });
});

test.describe('Nakamas Chat restore vs hat picker', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('minimizing the last popup keeps restore tappable', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Summer Cinema/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    await win.getByRole('button', { name: /^Ελαχιστοποίηση$|^Minimize$/ }).click();
    await expect(win).toHaveCount(0);
    await expect(page.getByRole('region', { name: /Επιλογή καπέλου συνομιλιών|Chat hat picker/ })).toHaveCount(0);
    const restore = page.getByRole('button', { name: /Επαναφορά συνομιλίας|Restore conversation/ });
    await expect(restore).toBeVisible();
    await restore.click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
  });
});

test.describe('Nakamas Chat event page', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the event Join button stays tappable under the hat', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e1');
    const hat = chatsButton(page);
    const hatBox = await hat.boundingBox();
    if (hatBox) {
      const start = { x: hatBox.x + hatBox.width / 2, y: hatBox.y + hatBox.height / 2 };
      const viewport = page.viewportSize() ?? { width: 390, height: 844 };
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(viewport.width / 2, viewport.height - 90, { steps: 10 });
      await page.mouse.up();
    }
    const join = page.getByRole('button', { name: /Μπες σε παρέα|Join a group|Η βραδιά μας|Our night/ });
    await expect(join).toBeVisible();
    const box = await join.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width - 10, box!.y + box!.height / 2);
    await expect(inbox(page)).toHaveCount(0);
  });

  test('the hat opens chat above the event action bar', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e1');
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Nakamas Chat landscape', () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test('a conversation row stays tappable', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    const row = sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator('[data-chat-window]')).toBeVisible();
  });

  test('close stays tappable on an event page', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e1');
    const sheet = await openInbox(page);
    await expect(sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ })).toBeVisible();
    const row = sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first();
    await expect(row).toBeVisible();
    await sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Nakamas Chat landscape desktop', () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test('popup close stays on screen and the hat returns', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    const row = sheet.getByRole('button').filter({ hasText: /Διοργανωτής|Organizer|Ομάδ|Group|Nakamas/ }).first();
    await expect(row).toBeVisible();
    await row.click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    const close = win.getByRole('button', { name: /^Κλείσιμο$|^Close$/ });
    await expect(close).toBeVisible();
    const box = await close.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    await close.click();
    await expect(win).toHaveCount(0);
    await expect(chatsButton(page)).toBeVisible();
  });

  test('a poll can be filled and sent in a short popup', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    await sheet.getByRole('button', { name: /Maria/ }).filter({ hasText: /Τέλεια|Great, see you/ }).click();
    const win = page.locator('[data-chat-window]');
    await expect(win).toBeVisible();
    await win.getByRole('button', { name: /Περισσότερα|More tools/ }).click();
    await win.getByRole('button', { name: /^Δημοσκόπηση$|^Poll$/ }).click();
    await win.getByPlaceholder(/Ερώτηση|Question/).fill('Coffee?');
    await win.getByPlaceholder(/Επιλογή|Option/).nth(0).fill('Yes');
    await win.getByPlaceholder(/Επιλογή|Option/).nth(1).fill('No');
    const send = win.getByRole('button', { name: /Send poll|^Αποστολή$/ });
    await send.scrollIntoViewIfNeeded();
    await expect(send).toBeVisible();
    const box = await send.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
    await send.click();
    await expect(win.getByText('Coffee?')).toBeVisible();
  });
});

test.describe('Nakamas Chat short desktop', () => {
  test.use({ viewport: { width: 1024, height: 650 } });

  test('inbox close stays on screen', async ({ page }) => {
    await enterDemoGuest(page);
    const sheet = await openInbox(page);
    const close = sheet.getByRole('button', { name: /^Κλείσιμο$|^Close$/ });
    await expect(close).toBeVisible();
    const box = await close.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    await close.click();
    await expect(sheet).toHaveCount(0);
  });
});
