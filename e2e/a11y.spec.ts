import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe smoke gate — serious/critical structural a11y on high-traffic surfaces.
 * color-contrast is excluded here: token pairs are gated by `npm run audit:contrast`;
 * full page×theme contrast remains residual (not WCAG certification).
 */
async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(
    serious,
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n'),
  ).toEqual([]);
}

test.describe('a11y axe smoke', () => {
  test('login page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('NAKAMAS', { exact: true })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test('home (demo guest) has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('#main-content')).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });
});
