import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';
import { revealNearbyMiniOutings } from './mini-outings';

test.describe('Find Nakamas', () => {
  test('keeps every action while staying one language and not repeating mini outings', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/buddy-seek');

    await expect(page.getByRole('heading', { level: 1, name: /Βρες Nakamas|Find Nakamas/ })).toBeVisible();
    await expect(page.locator('#main-content [data-image-depth]').first()).toHaveAttribute('data-image-depth', 'full');
    await expect(page.getByRole('button', { name: /Απόρρητο: ρυθμίσεις|Privacy settings/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Νέο αίτημα από εκδήλωση|New request from event/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Σχέδια: τα σχέδιά μου|Plans: my plans/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Παρέα τώρα: καφές ή βόλτα|Company now: coffee or a walk/ })).toBeVisible();
    await expect(page.locator('#main-content').getByRole('heading', { name: /Μικρές έξοδοι δίπλα σου|Small outings near you/ })).toHaveCount(0);
    await expect(page.locator('#main-content [data-mini-outing-card]')).toHaveCount(0);
    await expect(page.locator('#main-content').getByText('Καφές στο Κουκάκι')).toHaveCount(0);

    const filters = page.getByRole('button', { name: /^Φίλτρα$|^Filters$/ });
    await expect(filters).toBeVisible();
    await expect(page.getByRole('button', { name: /Υψηλή συμβατότητα|High match/ })).toHaveCount(0);
    await filters.click();
    await expect(page.getByRole('button', { name: /Υψηλή συμβατότητα|High match/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ανοιχτές θέσεις|Open spots/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Επαληθευμένοι|Verified/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Μικρές ομάδες|Small groups/ })).toBeVisible();

    await expect(page.getByRole('button', { name: /Αίτημα συμμετοχής|Ask to join/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Εκδήλωση$|^Event$/ }).first()).toBeVisible();
    const pagePhoto = page.locator('#main-content article img').first();
    await expect(pagePhoto).toBeVisible();
    await expect.poll(async () => pagePhoto.evaluate((el) => el.clientHeight)).toBeGreaterThan(170);
    await expect.poll(async () =>
      pagePhoto.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
    await expect(page.locator('article .lucide-clock').first()).toBeVisible();
    await expect(page.locator('article .lucide-map-pin').first()).toBeVisible();
    await expect(page.locator('article .lucide-users').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Αποθήκευση σχεδίου|Save plan/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Απόκρυψη σχεδίου|Hide plan/ }).first()).toBeVisible();

    await expect(page.getByText('Street food με μικρή ομάδα')).toHaveCount(0);
    await expect(page.getByText('Board game night')).toHaveCount(0);
    await expect(page.getByText('Chat πρώτα')).toHaveCount(0);
    await expect(page.getByText('Food & Drink')).toHaveCount(0);
    await expect(page.getByText(/Φαγητό δρόμου με μικρή ομάδα|Street food with a small group/)).toBeVisible();
    await expect(page.getByText(/Καφές πριν|Coffee before/)).toBeVisible();

    await page.getByRole('button', { name: /Νέο αίτημα από εκδήλωση|New request from event/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    await page.getByRole('button', { name: /Ακύρωση|Cancel/ }).click();

    await page.getByRole('button', { name: /Παρέα τώρα: καφές ή βόλτα|Company now: coffee or a walk/ }).click();
    const sheet = page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
    await expect(sheet).toBeVisible();
    await revealNearbyMiniOutings(sheet);
    await expect(sheet.getByText('Καφές στο Κουκάκι')).toBeVisible();
    const restrictedOuting = sheet.locator('[data-mini-outing-card]').filter({ hasText: 'Τρέξιμο στο Ζάππειο' });
    await restrictedOuting.getByRole('button', { name: /Μόνο γυναίκες & μη δυαδικά|Women & non-binary only/ }).click();
    await page.locator('[data-sonner-toast]').getByRole('button', { name: /Προφίλ|Profile/ }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('Discover rail matches the quiet Find Nakamas cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    const rail = page.getByRole('complementary', { name: /Βρες Nakamas|Find Nakamas/ });
    await expect(rail).toBeVisible({ timeout: 15_000 });
    await expect(rail.getByRole('heading', { name: /Βρες Nakamas|Find Nakamas/ })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Άνοιγμα Βρες Nakamas|Open Find Nakamas/ })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Κλείσιμο sidebar|Close sidebar/ })).toBeVisible();
    await expect(rail.getByText('Koukaki, Athens')).toHaveCount(0);
    await expect(rail.getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    await expect(rail.getByRole('button', { name: /Αίτημα συμμετοχής|Ask to join/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /^Εκδήλωση$|^Event$/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /Αποθήκευση σχεδίου|Save plan/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /Απόκρυψη σχεδίου|Hide plan/ }).first()).toBeVisible();
    await expect(rail.getByText(/Φαγητό δρόμου με μικρή ομάδα|Street food with a small group/)).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/,
      }),
    ).toContainText(/Βρες παρέα τώρα|Find company now/);
    await expect(page.locator('[data-find-company-cta="header"]')).toBeVisible();
    await expect(page.locator('[data-find-company-cta="float"]:visible')).toHaveCount(0);
  });

  test('web header sits the nearby shortcut left of search; phones keep it floated', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    await page.goto('/connections');
    const headerCta = page.locator('[data-find-company-cta="header"]');
    const search = page.getByPlaceholder(/Αναζήτηση εκδηλώσεων|Search events/);
    await expect(headerCta).toBeVisible();
    await expect(search).toBeVisible();
    const ctaBox = await headerCta.boundingBox();
    const searchBox = await search.boundingBox();
    expect(ctaBox).toBeTruthy();
    expect(searchBox).toBeTruthy();
    expect(ctaBox!.y).toBeLessThan(80);
    expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(searchBox!.x + 4);
    await expect(headerCta).toContainText(/Βρες παρέα τώρα|Find company now/);
    await headerCta.click();
    await expect(page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ })).toBeVisible();
    await page.getByRole('button', { name: /^Κλείσιμο$|^Close$/ }).last().click();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-find-company-cta="header"]')).toBeHidden();
    const floatCta = page.locator('[data-find-company-cta="float"]:visible');
    await expect(floatCta).toBeVisible();
    const floatBox = await floatCta.boundingBox();
    expect(floatBox).toBeTruthy();
    expect(floatBox!.y).toBeGreaterThan(500);
  });

  test('desktop page cards show a tall photo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    await page.goto('/buddy-seek');
    await expect(page.locator('#main-content').getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    const photo = page.locator('#main-content article img').first();
    await expect(photo).toBeVisible();
    await expect.poll(async () => photo.evaluate((el) => el.clientHeight)).toBeGreaterThan(280);
    await expect.poll(async () =>
      photo.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
  });

  test('mobile sheet is nearby outings, not My Plans or the event feed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.getByRole('button', { name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/ }).click();
    const sheet = page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: /Βρες παρέα τώρα|Find company now/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Τα σχέδιά μου|My plans/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Βρες παρέα για εκδήλωση|Find company for an event/ })).toBeVisible();
    await expect(sheet.getByRole('heading', { name: /Μικρές έξοδοι δίπλα σου|Small outings near you/ })).toBeVisible();
    await expect(sheet.locator('[data-card-image-picker]')).toBeVisible();
    await expect(sheet.getByText('Athens Street Food Festival 2026')).toHaveCount(0);
    await revealNearbyMiniOutings(sheet);
    await expect(sheet.locator('[data-image-depth]').first()).toHaveAttribute('data-image-depth', 'full');
    await expect(sheet.getByText('Καφές στο Κουκάκι')).toBeVisible();
    const coffeeCover = sheet.locator('[data-mini-outing-card]').filter({ hasText: 'Καφές στο Κουκάκι' }).locator('img');
    await expect(coffeeCover).toBeVisible();
    await expect.poll(async () =>
      coffeeCover.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
    await sheet.getByRole('button', { name: /Βρες παρέα για εκδήλωση|Find company for an event/ }).click();
    await expect(page).toHaveURL(/\/buddy-seek/);
    await expect(page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ })).toHaveCount(0);
    await expect(page.locator('#main-content').getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    await expect(page.getByText(/Street food με μικρή ομάδα|Street food with a small group|Φαγητό δρόμου με μικρή ομάδα/)).toBeVisible();
  });

  test('My Plans does not open the nearby overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/plans');
    await expect(page.getByRole('heading', { level: 1, name: /Τα Σχέδιά μου|My Plans/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Βρες παρέα τώρα — μικρές έξοδοι δίπλα σου|Find company now — small outings next to you/ }),
    ).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Μικρές έξοδοι δίπλα σου|Small outings near you/ })).toHaveCount(0);
  });

  test('at 1024 the header shortcut is the people icon', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await enterDemoGuest(page);
    await page.goto('/connections');
    const headerCta = page.locator('[data-find-company-cta="header"]');
    await expect(headerCta).toBeVisible();
    await expect(headerCta.locator('span')).toBeHidden();
    const box = await headerCta.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThan(56);
    await headerCta.click();
    await expect(page.getByRole('dialog', { name: /Βρες παρέα τώρα|Find company now/ })).toBeVisible();
  });
});
