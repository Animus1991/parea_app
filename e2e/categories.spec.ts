import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

async function openCategories(page: Page) {
  await enterDemoGuest(page);
  await page.goto('/categories');
  await expect(page.locator('#main-content')).toBeVisible();
}

test.describe('categories discovery', () => {
  test('shows the categories heading', async ({ page }) => {
    await openCategories(page);
    await expect(page.getByRole('heading', { level: 1, name: /Κατηγορίες|Categories/ })).toBeVisible();
  });

  test('a trending chip applies and clears its exact category filter', async ({ page }) => {
    await openCategories(page);
    const trending = page.getByTestId('category-trending-chip').first();
    const categoryName = await trending.getAttribute('data-category-name');
    expect(categoryName).toBeTruthy();

    await trending.click();
    await expect.poll(() => new URL(page.url()).searchParams.get('c')).toBe(categoryName);
    await expect(page.getByRole('button', { name: /Αφαίρεση φίλτρου|Remove .* filter/ })).toBeVisible();

    await page.getByRole('button', { name: /Αφαίρεση φίλτρου|Remove .* filter/ }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('c')).toBeNull();
  });

  test('a group chip narrows the category tiles', async ({ page }) => {
    await openCategories(page);
    const tiles = page.locator('[data-testid="category-tile"]:visible');
    await expect(tiles).toHaveCount(20);
    const allCount = await tiles.count();
    const groups = page.getByRole('group', { name: /Ομάδες κατηγοριών|Category groups/ });
    await groups.getByRole('button', { name: /Τέχνες & θέαμα|Arts & shows/ }).click();

    await expect(tiles).toHaveCount(5);
    expect(await tiles.count()).toBeLessThan(allCount);
  });

  test('shows eight mobile tiles before expanding the category list', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCategories(page);
    const tiles = page.locator('[data-testid="category-tile"]:visible');
    await expect(tiles).toHaveCount(8);

    await page.getByRole('button', { name: /Όλες οι \d+ κατηγορίες|All \d+ categories/ }).click();
    await expect(tiles).toHaveCount(20);
  });

  test('filters with an unaccented query and restores it after reload', async ({ page }) => {
    await openCategories(page);
    const results = page.locator('#events-area').getByText(/αποτελέσματα|results found/i);
    await expect(results).toBeVisible();
    const initialResults = await results.textContent();
    const search = page.getByRole('searchbox', {
      name: /Αναζήτηση κατηγορίας ή εκδήλωσης|Search a category or event/,
    });
    await search.fill('κοινωνικα');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('κοινωνικα');
    await expect.poll(() => results.textContent()).not.toBe(initialResults);
    await expect.poll(async () => page.getByTestId('upcoming-events-grid').locator(':scope > *').count())
      .toBeGreaterThan(0);

    await page.reload();
    await expect(
      page.getByRole('searchbox', {
        name: /Αναζήτηση κατηγορίας ή εκδήλωσης|Search a category or event/,
      }),
    ).toHaveValue('κοινωνικα');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('κοινωνικα');
    await expect.poll(async () => page.getByTestId('upcoming-events-grid').locator(':scope > *').count())
      .toBeGreaterThan(0);
  });

  test('browser Back restores the category URL filters', async ({ page }) => {
    await openCategories(page);
    await page.goto('/categories?c=Social&price=Free&when=Weekend&sort=Trending');
    await page.goto('/collections');
    await page.goBack();

    await expect.poll(() => new URL(page.url()).pathname).toBe('/categories');
    await expect.poll(() => new URL(page.url()).searchParams.get('c')).toBe('Social');
    await expect(page.getByRole('button', { name: /Αφαίρεση φίλτρου|Remove .* filter/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Φίλτρο κόστους|Cost filter/ }))
      .toHaveText(/Μόνο δωρεάν|Free only/);
  });

  test('past events are kept in a collapsed disclosure', async ({ page }) => {
    await openCategories(page);
    const seededPastEvent = await page.evaluate(() => {
      const key = 'nakamas-store-v1';
      const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
      const events = stored.state?.events;
      if (!Array.isArray(events) || events.length === 0) return null;
      const [first, ...rest] = events;
      stored.state.events = [{ ...first, date: '2000-01-01', time: '10:00' }, ...rest];
      localStorage.setItem(key, JSON.stringify(stored));
      return first.id;
    });
    expect(seededPastEvent).toBeTruthy();

    await page.reload();
    await page.goto('/categories');
    const summary = page.getByText(/Περασμένες εκδηλώσεις|Past events/);
    await expect(summary).toBeVisible();
    const details = page.locator('details').filter({ has: summary });
    await expect(details).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');
  });
});
