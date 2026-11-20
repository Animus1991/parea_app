import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Discover quiet-reveal chips', () => {
  test('name hidden nights by day clash, full, or already joined — not mixed jargon', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterDemoGuest(page);
    const main = page.locator('#main-content');
    await expect(main).toBeVisible({ timeout: 15_000 });

    const clash = main.getByRole('button', {
      name: /Δείξε \d+ που πέφτ(ει|ουν) την ίδια μέρα με σχέδιό σου|Show \d+ on a day you already planned/,
    });
    const full = main.getByRole('button', {
      name: /Δείξε \d+ πλήρ(η|εις)|Show \d+ that (is|are) full/,
    });
    const joined = main.getByRole('button', {
      name: /Δείξε \d+ που έχεις ήδη θέση|Show \d+ you already joined/,
    });

    await expect(clash.or(full).or(joined).first()).toBeVisible();
    await expect(main.getByRole('button', { name: /Ίδια ώρα με σχέδιά σου|Same time as your plans/ })).toHaveCount(0);
    await expect(main.getByRole('button', { name: /Πλήρεις ή ήδη μέσα|Full or already in/ })).toHaveCount(0);

    if (await clash.count()) {
      await clash.first().click();
      await expect(
        main.getByRole('button', { name: /Κρύψε όσες πέφτουν την ίδια μέρα|Hide ones on a day you already planned/ }),
      ).toBeVisible();
    }
  });
});
