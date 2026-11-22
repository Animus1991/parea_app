import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test('forming sheet and desktop rail load only when needed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const modules: string[] = [];
  page.on('request', (request) => modules.push(request.url()));
  await enterDemoGuest(page);
  expect(modules.some((url) => url.includes('/PlansFormingBottomSheet.tsx'))).toBe(false);
  expect(modules.some((url) => url.includes('/PlansFormingSidebar.tsx'))).toBe(false);
  await page.getByRole('button', { name: /Βρες παρέα τώρα —|Find company now —/ }).filter({ visible: true }).click();
  const sheet = page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
  await expect(sheet).toBeVisible();
  expect(modules.some((url) => url.includes('/PlansFormingBottomSheet.tsx'))).toBe(true);
  await sheet.getByRole('button', { name: /Κλείσιμο|Close/, exact: true }).last().click();
  await page.setViewportSize({ width: 1440, height: 900 });
  const rail = page.getByRole('complementary', { name: /Βρες Nakamas|Find Nakamas/ });
  await expect(rail).toBeVisible();
  expect(modules.some((url) => url.includes('/PlansFormingSidebar.tsx'))).toBe(true);
  await rail.getByRole('button', { name: /Κλείσιμο sidebar|Close sidebar/ }).click();
  await page.getByRole('button', { name: /Βρες Nakamas — παρέα|Find Nakamas — company/ }).click();
  await expect(rail).toBeVisible();
});

test('reconnect links still open the deferred forming sheet', async ({ page }) => {
  await enterDemoGuest(page);
  await page.goto('/buddy-seek?reconnect=Maria');
  await expect(page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ })).toBeVisible();
});
