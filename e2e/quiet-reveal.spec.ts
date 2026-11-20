import { test, expect, type Page } from '@playwright/test';

const STORE_KEY = 'nakamas-store-v1';

async function enterDemoAlex(page: Page) {
  await page.goto('/login');
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    data.state = { ...(data.state ?? {}), onboardingCompleted: true };
    localStorage.setItem(key, JSON.stringify(data));
  }, STORE_KEY);
  await page.reload();
  await page.getByRole('button', { name: /Alex/ }).first().click();
  await expect(page.locator('#main-content')).toBeVisible({ timeout: 15_000 });
}

test.describe('Discover quiet catalog in advanced filters', () => {
  test('lives in Φίλτρα with spoken Greek, not as feed chips', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterDemoAlex(page);
    const main = page.locator('#main-content');
    await expect(main).toBeVisible({ timeout: 15_000 });
    await main.getByRole('button', { name: /^Όλες$|^All$/ }).click();

    await expect(main.getByRole('button', { name: /Δείξε \d+|Κρύψε / })).toHaveCount(0);
    await expect(main.getByText(/Κι άλλα που συνήθως κρύβουμε|Usually hidden/)).toHaveCount(0);
    await expect(main.getByRole('button', { name: /Ίδια ώρα με σχέδιά σου|Same time as your plans/ })).toHaveCount(0);
    await expect(main.getByRole('button', { name: /Πλήρεις ή ήδη μέσα|Full or already in/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Φίλτρα αναζήτησης|Search filters/ }).click();

    const panel = page.getByTestId('home-quiet-reveal-filters');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Κι άλλα που συνήθως κρύβουμε|Usually hidden/)).toBeVisible();

    await expect(panel.getByText(/Την ίδια μέρα που έχεις ήδη κάτι|Same day as something you already booked/)).toBeVisible();
    await expect(panel.getByText(/Αυτές που έχεις ήδη κλείσει|Ones you've already booked/)).toBeVisible();

    await panel.locator('label').filter({ hasText: /Αυτές που έχεις ήδη κλείσει|Ones you've already booked/ }).click();

    await expect(
      main.getByRole('button', {
        name: /Αφαίρεση φίλτρου Ήδη κλεισμένες|Remove Already booked filter/,
      }),
    ).toBeVisible();
  });
});
