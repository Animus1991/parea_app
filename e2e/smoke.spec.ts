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
