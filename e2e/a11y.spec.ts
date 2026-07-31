import { test, expect } from '@playwright/test';
import {
  A11Y_ROUTES,
  A11Y_THEMES_CI,
  enterDemoGuest,
  expectNoSeriousAxeViolations,
  seedTheme,
} from './a11y-helpers';

/**
 * Structural a11y smoke (no color-contrast) — fast CI gate.
 * Pixel contrast is covered by the matrix below + token audit.
 */
test.describe('a11y axe smoke', () => {
  test('login page has no serious/critical structural axe violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('NAKAMAS', { exact: true })).toBeVisible();
    await expectNoSeriousAxeViolations(page, { includeColorContrast: false });
  });

  test('home (demo guest) has no serious/critical structural axe violations', async ({ page }) => {
    await enterDemoGuest(page);
    await expectNoSeriousAxeViolations(page, { includeColorContrast: false });
  });
});

/**
 * Page × theme matrix with color-contrast enabled.
 * Not a third-party WCAG certification — engineering gate on high-traffic surfaces.
 */
test.describe('a11y page × theme matrix', () => {
  test.describe.configure({ mode: 'serial' });

  for (const theme of A11Y_THEMES_CI) {
    test.describe(`theme=${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await seedTheme(page, theme);
      });

      for (const route of A11Y_ROUTES) {
        test(`${route.name} (${route.path})`, async ({ page }) => {
          if (route.path === '/login') {
            await page.goto('/login');
            await expect(page.getByText('NAKAMAS', { exact: true })).toBeVisible();
          } else {
            await enterDemoGuest(page);
            if (route.path !== '/') {
              await page.goto(route.path);
            }
            await expect(page.locator('#main-content')).toBeVisible({ timeout: 15_000 });
          }
          // Login shell has no data-theme; still run contrast on composed UI.
          await expectNoSeriousAxeViolations(page, { includeColorContrast: true });
        });
      }
    });
  }
});
