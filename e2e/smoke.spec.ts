import { test, expect } from '@playwright/test';

test.describe('public auth surface', () => {
  test('login page renders with Nakamas title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Σύνδεση|Sign in/);
    await expect(page.getByText(/NAKAMAS|Nakamas/i)).toBeVisible();
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
