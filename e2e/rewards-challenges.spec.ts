import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test('challenges retain every goal without fabricated progress or countdowns', async ({ page }) => {
  await enterDemoGuest(page);
  await page.goto('/challenges');
  await expect(page.locator('#main-content h3')).toHaveCount(6);
  await expect(page.getByRole('progressbar')).toHaveCount(5);
  await expect(page.getByText(/ημέρες απομένουν|days left/)).toHaveCount(1);
  await expect(page.getByText(/Χωρίς προθεσμία|No deadline/)).toHaveCount(5);
  await expect(page.getByText(/Η αυτόματη καταγραφή προόδου|Automatic progress tracking/)).toBeVisible();
  const quickJoin = page.locator('h3').filter({ hasText: /Γρήγορη εγγραφή|Quick Join/ }).locator('xpath=ancestor::article | ancestor::*[contains(@class,"h-full")][1]').first();
  await expect(quickJoin.getByRole('progressbar')).toHaveCount(0);
  await quickJoin.getByRole('button', { name: /Συμμετοχή|Join/, exact: true }).click();
  await expect(quickJoin.getByRole('button', { name: /Αποχώρηση|Leave/, exact: true })).toBeVisible();
});
