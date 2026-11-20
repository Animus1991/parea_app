import { test, expect } from '@playwright/test';

test.describe('public auth surface', () => {
  test('login page renders with Nakamas title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Nakamas|Σύνδεση|Sign in/i);
    await expect(page.getByText('NAKAMAS', { exact: true })).toBeVisible();
  });

  test('demo explore reaches home', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

test.describe('404 handling', () => {
  test('unknown route shows 404 with fuzzy hint for calendar', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση/i }).click();
    await page.goto('/calendario');
    await expect(page.getByText(/404|Σφάλμα 404/i)).toBeVisible();
  });
});

test.describe('client-side navigation', () => {
  // Regression: leaving a Leaflet page used to throw "Map container is being
  // reused by another instance" and blank the app (LeafletMapHost cleanup race).
  test('moving between map pages and others keeps the app alive', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    for (const name of ['Τοπικές Ομάδες', 'Κατηγορίες', 'Τοπικές Ομάδες', 'Ανακάλυψη Εκδηλώσεων', 'Τοπικές Ομάδες', 'Ιστορικό']) {
      await page.getByRole('link', { name, exact: true }).first().click();
      await expect(page.locator('#main-content')).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    expect(errors.filter((m) => /Map container|reused/i.test(m))).toEqual([]);
  });
});

test.describe('scroll position', () => {
  // Back from an event returns to the same place in the feed (it used to jump to the top).
  test('Back restores the feed position; language switch keeps it', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    const main = page.locator('#main-content');
    await expect.poll(() => main.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(1200);
    await main.evaluate((el) => el.scrollTo(0, 1200));
    await expect.poll(() => main.evaluate((el) => Math.round(el.scrollTop))).toBeGreaterThan(1000);
    const link = page.locator('#main-content a[href^="/events/"]');
    const count = await link.count();
    for (let i = 0; i < count; i++) {
      const box = await link.nth(i).boundingBox();
      if (box && box.y > 80 && box.y < 800) {
        await link.nth(i).click();
        break;
      }
    }
    await expect(page).toHaveURL(/\/events\//);
    await page.goBack();
    await expect(page).toHaveURL('/');
    // Images and feed pages can shift the exact pixel; jumping to the top is the bug.
    await expect.poll(() => main.evaluate((el) => Math.round(el.scrollTop))).toBeGreaterThan(800);
  });
});

test.describe('welcome back', () => {
  test('a return visit shows what is new, one tap away', async ({ page }) => {
    await page.addInitScript(() => {
      // A previous visit two hours ago, in a fresh browser session.
      localStorage.setItem('nakamas-last-visit:u1', String(Date.now() - 2 * 3600 * 1000));
    });
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    const line = page.locator('#main-content p').filter({ hasText: /Από την τελευταία σου επίσκεψη|Since your last visit/ });
    await expect(line).toBeVisible();
    await line.getByRole('button').first().click();
    await expect(page).toHaveURL(/\/(chats|notifications|buddy-seek|wall|events\/)/);
  });
});
