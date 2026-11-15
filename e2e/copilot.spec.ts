import { test, expect } from '@playwright/test';
import { A11Y_THEMES_CI, enterDemoGuest, expectNoSeriousAxeViolations, seedTheme } from './a11y-helpers';

/** Φ23/Φ24 — Nakamas AI copilot (runs on the on-device engine; no API key needed). */
test.describe('Nakamas AI copilot', () => {
  test('opens with Ctrl+J, acts on the app and supports undo', async ({ page }) => {
    await enterDemoGuest(page);
    await page.keyboard.press('Control+j');
    const input = page.locator('#copilot-input');
    await expect(input).toBeVisible();

    await input.fill('βάλε σκοτεινό θέμα');
    await input.press('Enter');
    await expect(page.locator('[data-theme$="-dark"]').first()).toBeVisible();

    await input.fill('αναίρεση');
    await input.press('Enter');
    await expect(page.locator('[data-theme="classic"]').first()).toBeVisible();
  });

  test('searches events and saves one by ordinal', async ({ page }) => {
    await enterDemoGuest(page);
    await page.getByRole('button', { name: /Nakamas AI/ }).first().click();
    const input = page.locator('#copilot-input');
    await input.fill('βρες πεζοπορία');
    await input.press('Enter');
    await expect(page.getByRole('list', { name: /Αποτελέσματα|Results/ }).first()).toBeVisible();
    await input.fill('αποθήκευσε το πρώτο');
    await input.press('Enter');
    await expect(page.getByText(/Αποθήκευσα|is already saved|είναι ήδη αποθηκευμένη|Saved/).first()).toBeVisible();
  });

  test('catches the user up on «τι νέο;»', async ({ page }) => {
    await enterDemoGuest(page);
    await page.getByRole('button', { name: /Nakamas AI/ }).first().click();
    const input = page.locator('#copilot-input');
    await input.fill('τι νέο υπάρχει;');
    await input.press('Enter');
    await expect(page.getByText(/Τι νέο υπάρχει:|Είσαι ενημερωμένος/).first()).toBeVisible();
  });

  test('asks for confirmation before changing privacy', async ({ page }) => {
    await enterDemoGuest(page);
    // Open via the launcher: under parallel load an early Ctrl+J can land before
    // the shortcut listener mounts (the shortcut itself is covered above).
    await page.getByRole('button', { name: /Nakamas AI/ }).first().click();
    const input = page.locator('#copilot-input');
    await expect(input).toBeVisible();
    await input.fill('κάνε το προφίλ μου ιδιωτικό');
    await input.press('Enter');
    const confirm = page.getByRole('button', { name: /Επιβεβαίωση|Confirm/ }).last();
    await expect(confirm).toBeVisible();
    await confirm.click();
    await expect(page.getByText(/Ενημέρωσα το απόρρητο|Privacy updated/)).toBeVisible();
  });

  for (const theme of A11Y_THEMES_CI) {
    test(`copilot panel (results + confirmation) is axe-clean · theme=${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await seedTheme(page, theme);
      await enterDemoGuest(page);
      // Launcher, not Ctrl+J: under parallel load an early shortcut can land
      // before the app is interactive (same as the privacy test above).
      await page.getByRole('button', { name: /Nakamas AI/ }).first().click();
      const input = page.locator('#copilot-input');
      await expect(input).toBeVisible();
      await input.fill('βρες πεζοπορία');
      await input.press('Enter');
      await expect(page.getByRole('list', { name: /Αποτελέσματα|Results/ }).first()).toBeVisible();
      await input.fill('κάνε το προφίλ μου ιδιωτικό');
      await input.press('Enter');
      await expect(page.getByRole('button', { name: /Επιβεβαίωση|Confirm/ }).last()).toBeVisible();
      await expectNoSeriousAxeViolations(page, { includeColorContrast: true });
    });
  }
});
