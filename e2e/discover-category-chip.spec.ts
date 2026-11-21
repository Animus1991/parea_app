import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Discover category chip', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('fresh Discover is not locked to Theater & Dance', async ({ page }) => {
    await enterDemoGuest(page);
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Αφαίρεση φίλτρου Θέατρο & χορός|Remove Theater & Dance filter/,
      }),
    ).toHaveCount(0);
  });

  test('removing Theater & Dance does not loop back onto dance-only cards', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/?cat=Theater+%26+Dance');
    await expect(page.locator('#main-content')).toBeVisible();

    const chip = page.getByRole('button', {
      name: /Αφαίρεση φίλτρου Θέατρο & χορός|Remove Theater & Dance filter/,
    });
    await expect(chip).toBeVisible();
    const countLabel = page.getByText(/\d+\s+(αποτέλεσμα|αποτελέσματα|result|results)/);
    const filteredLabel = (await countLabel.first().textContent()) ?? '';

    await chip.click();
    await expect(chip).toHaveCount(0);

    await expect
      .poll(() => new URL(page.url()).searchParams.get('cat'), { timeout: 2000 })
      .toBeNull();

    await expect(countLabel.first()).not.toHaveText(filteredLabel);
    const openLabel = (await countLabel.first().textContent()) ?? '';
    await page.waitForTimeout(1200);
    await expect(countLabel.first()).toHaveText(openLabel);
    await expect(chip).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('cat')).toBeNull();
  });
});
