import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Find Nakamas', () => {
  test('keeps every action while staying one language and not repeating mini outings', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/buddy-seek');

    await expect(page.getByRole('heading', { level: 1, name: /Βρες Nakamas|Find Nakamas/ })).toBeVisible();
    await expect(page.locator('#main-content [data-image-depth]').first()).toHaveAttribute('data-image-depth', 'full');
    await expect(page.getByRole('button', { name: /Ρυθμίσεις απορρήτου|Privacy settings/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Νέο αίτημα από εκδήλωση|New request from event/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Τα σχέδιά μου|My plans/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Νέα μικρή έξοδος|New small outing/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Συλλογές|Collections/ })).toBeVisible();

    await expect(page.getByText('Κουκάκι, Αθήνα').or(page.getByText('Koukaki, Athens'))).toBeVisible();
    await expect(page.getByText('Καφές στο Κουκάκι')).toHaveCount(1);
    const coffeeCard = page.locator('[data-mini-outing-card]').filter({ hasText: 'Καφές στο Κουκάκι' });
    const coffeeCover = coffeeCard.locator('img');
    await expect(coffeeCover).toBeVisible();
    await expect(coffeeCover).toHaveAttribute('src', /\/covers\/coffee\.jpg/);
    await expect(coffeeCard.getByRole('button', { name: 'Καφές στο Κουκάκι' })).toBeVisible();
    await expect(coffeeCard.getByRole('button', { name: /Λεπτομέρειες|Details/ })).toBeVisible();

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

    await page.getByRole('button', { name: /Νέο αίτημα από εκδήλωση|New request from event/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Ακύρωση|Cancel/ }).click();

    await coffeeCard.getByRole('button', { name: 'Καφές στο Κουκάκι' }).click();
    await expect(page).toHaveURL(/\/events\//);
  });

  test('Discover rail matches the quiet Find Nakamas cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    const rail = page.getByRole('complementary', { name: /Βρες Nakamas|Find Nakamas/ });
    await expect(rail).toBeVisible({ timeout: 15_000 });
    await expect(rail.getByRole('heading', { name: /Βρες Nakamas|Find Nakamas/ })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Όλα τα σχέδια|All plans/ })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Κλείσιμο sidebar|Close sidebar/ })).toBeVisible();
    await expect(rail.getByText('Koukaki, Athens')).toHaveCount(0);
    await expect(rail.getByText('Καφές στο Κουκάκι')).toHaveCount(0);
    await expect(rail.getByRole('button', { name: /Αίτημα συμμετοχής|Ask to join/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /^Εκδήλωση$|^Event$/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /Αποθήκευση σχεδίου|Save plan/ }).first()).toBeVisible();
    await expect(rail.getByRole('button', { name: /Απόκρυψη σχεδίου|Hide plan/ }).first()).toBeVisible();
    await expect(rail.getByText(/Φαγητό δρόμου με μικρή ομάδα|Street food with a small group/)).toBeVisible();
  });

  test('desktop page cards show a tall photo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterDemoGuest(page);
    await page.goto('/buddy-seek');
    const coffeeCover = page.locator('[data-mini-outing-card]').filter({ hasText: 'Καφές στο Κουκάκι' }).locator('img');
    await expect(coffeeCover).toBeVisible();
    await expect(coffeeCover).toHaveAttribute('src', /\/covers\/coffee\.jpg/);
    await expect.poll(async () =>
      coffeeCover.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
    const photo = page.locator('#main-content article img').first();
    await expect(photo).toBeVisible();
    await expect.poll(async () => photo.evaluate((el) => el.clientHeight)).toBeGreaterThan(280);
    await expect.poll(async () =>
      photo.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
  });

  test('mobile sheet shows the intro, outing photos, and scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.getByRole('button', { name: /Βρες Nakamas — σχέδια που σχηματίζονται|Find Nakamas — plans forming/ }).click();
    const sheet = page.getByRole('dialog', { name: /Βρες Nakamas|Find Nakamas/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Ρυθμίσεις απορρήτου|Privacy settings/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Νέο αίτημα από εκδήλωση|New request from event/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Τα σχέδιά μου|My plans/ })).toBeVisible();
    await expect(sheet.getByRole('heading', { name: /Μικρές έξοδοι|Small outings/ })).toBeVisible();
    await expect(sheet.getByText('Καφές στο Κουκάκι')).toBeVisible();
    const coffeeCover = sheet.locator('[data-mini-outing-card]').filter({ hasText: 'Καφές στο Κουκάκι' }).locator('img');
    await expect(coffeeCover).toBeVisible();
    await expect.poll(async () =>
      coffeeCover.evaluate((el) => (el as HTMLImageElement).naturalHeight),
    ).toBeGreaterThan(80);
    await expect(sheet.getByRole('button', { name: /^Φίλτρα$|^Filters$/ })).toBeVisible();
    const scroller = sheet.locator('[data-plans-sheet-scroll]');
    await expect(scroller).toBeVisible();
    await scroller.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(sheet.getByText('Athens Street Food Festival 2026')).toBeVisible();
    await expect(sheet.getByText('ADD Festival 2026')).toBeVisible();
    await sheet.getByRole('button', { name: /Δες εκδήλωση|View event/ }).first().click();
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.getByRole('dialog', { name: /Βρες Nakamas|Find Nakamas/ })).toHaveCount(0);
  });
});
