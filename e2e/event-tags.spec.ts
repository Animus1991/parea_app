import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

test.describe('Event tags', () => {
  test('Discover cards keep long tag labels fully visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.locator('#main-content .hero-search-field').fill('nakamas');
    const tag = page.locator('#main-content [data-event-tag="nakamas-nights"]').first();
    await expect(tag).toBeVisible({ timeout: 15_000 });
    await expect(tag).toHaveText(/Nakamas Nights/i);
    const fit = await tag.evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
      ellipsis: getComputedStyle(el).textOverflow,
    }));
    expect(fit.ellipsis).not.toBe('ellipsis');
    expect(fit.scroll).toBeLessThanOrEqual(fit.client + 1);
  });

  test('card chips show the full label and open the reusable tags index', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/collections/nakamas-nights');

    const tag = page.locator('[data-event-tag="nakamas-nights"]').first();
    await expect(tag).toBeVisible({ timeout: 15_000 });
    await expect(tag).toHaveText(/Nakamas Nights/i);

    const fit = await tag.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        scroll: el.scrollWidth,
        client: el.clientWidth,
        ellipsis: style.textOverflow,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      };
    });
    expect(fit.text).toMatch(/Nakamas Nights/i);
    expect(fit.ellipsis).not.toBe('ellipsis');
    expect(fit.scroll).toBeLessThanOrEqual(fit.client + 1);

    await tag.click();
    await expect(page).toHaveURL(/\/tags\/nakamas-nights$/);
    await expect(page.getByRole('heading', { level: 1, name: /Nakamas Nights/i })).toBeVisible();
    await expect(page.locator('#tag-events .nakamas-card')).not.toHaveCount(0);

    await page.getByRole('searchbox', { name: /Αναζήτηση ετικέτας|Search a tag/ }).fill('workshop');
    const addWorkshop = page.getByRole('link', { name: /Προσθήκη Εργαστήριο|Add Workshop/ });
    await expect(addWorkshop).toHaveAttribute('href', /t=nakamas-nights.*t=workshop|t=workshop.*t=nakamas-nights/);
    await addWorkshop.click();
    await expect(page).toHaveURL(/t=nakamas-nights.*t=workshop|t=workshop.*t=nakamas-nights/);
    await expect(page.getByRole('heading', { level: 1, name: /Nakamas Nights/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Εργαστήριο|workshop/i })).toBeVisible();
  });

  test('the tags index is one language, without duplicate chips', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags');
    await expect(page.getByRole('heading', { level: 1, name: /Ετικέτες|Tags/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Επιτραπέζια|Board games/ })).toHaveCount(1);
    await expect(page.getByText(/^#art$/i)).toHaveCount(0);
  });

  test('detailed A–Z puts letters on the same row as their tags; compact hides the jump nav', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags');
    await expect(page.getByRole('navigation', { name: /Ευρετήριο γραμμάτων|Letter index/ })).toBeVisible();

    const letterRow = page.locator('#tag-letter-Α, [id^="tag-letter-"]').first();
    await expect(letterRow).toBeVisible();
    const aligned = await letterRow.evaluate((el) => {
      const heading = el.querySelector('h2');
      const chip = el.querySelector('a');
      if (!heading || !chip) return null;
      const letterBox = heading.getBoundingClientRect();
      const chipBox = chip.getBoundingClientRect();
      return {
        deltaTop: Math.abs(letterBox.top - chipBox.top),
        letterLeft: letterBox.left,
        chipLeft: chipBox.left,
      };
    });
    expect(aligned).not.toBeNull();
    expect(aligned!.chipLeft).toBeGreaterThan(aligned!.letterLeft);
    expect(aligned!.deltaTop).toBeLessThan(8);

    await page.getByRole('button', { name: /^Σύντομη$|^Compact$/ }).click();
    await expect(page.getByRole('navigation', { name: /Ευρετήριο γραμμάτων|Letter index/ })).toHaveCount(0);
    await expect(page.locator('[id^="tag-letter-"]').first()).toBeVisible();
  });

  test('selected tag shows its event cards above the index', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags/nakamas-nights');
    await expect(page.getByRole('heading', { level: 1, name: /Nakamas Nights/i })).toBeVisible();
    const events = page.locator('#tag-events');
    const directory = page.getByRole('region', { name: /Όλες οι ετικέτες|All tags/ });
    await expect(events).toBeVisible();
    await expect(directory).toBeVisible();
    const order = await page.evaluate(() => {
      const eventsEl = document.getElementById('tag-events');
      const indexEl = document.querySelector('[aria-label="Όλες οι ετικέτες"], [aria-label="All tags"]');
      if (!eventsEl || !indexEl) return null;
      const pos = eventsEl.compareDocumentPosition(indexEl);
      return (pos & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(order).toBe(true);
    await expect(events.locator('.nakamas-card')).not.toHaveCount(0);
  });

  test('the index keeps several tags selected at once', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags');
    await page.getByRole('link', { name: /Κοινωνικά|Social/ }).first().click();
    await expect(page).toHaveURL(/\/tags\/social$/);
    const addFree = page.getByRole('link', { name: /Προσθήκη Δωρεάν|Add Free/ });
    await expect(addFree).toHaveAttribute('href', /t=social.*t=free|t=free.*t=social/);
    await addFree.click();
    await expect(page).toHaveURL(/t=social.*t=free|t=free.*t=social/);
    await expect(page.locator('#tag-events .nakamas-card')).not.toHaveCount(0);
    const removeSocial = page.getByRole('link', { name: /Αφαίρεση Κοινωνικά|Remove Social/ }).first();
    await expect(removeSocial).toHaveAttribute('href', /\/tags\/free$/);
    await removeSocial.click();
    await expect(page).toHaveURL(/\/tags\/free$/);
  });

  test('compact wrapped chips keep their own bottom edge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags');
    await page.getByRole('button', { name: /^Σύντομη$|^Compact$/ }).click();
    const pair = await page.evaluate(() => {
      const groups = [...document.querySelectorAll<HTMLElement>('[id^="tag-letter-"]')];
      for (const group of groups) {
        const chips = [...group.querySelectorAll('a')];
        for (let i = 0; i < chips.length; i++) {
          const upper = chips[i].getBoundingClientRect();
          for (let j = i + 1; j < chips.length; j++) {
            const lower = chips[j].getBoundingClientRect();
            const overlapsX = Math.min(upper.right, lower.right) - Math.max(upper.left, lower.left) > 8;
            if (overlapsX && lower.top > upper.bottom) {
              return {
                upperHref: chips[i].getAttribute('href') || '',
                lowerHref: chips[j].getAttribute('href') || '',
                x: (Math.max(upper.left, lower.left) + Math.min(upper.right, lower.right)) / 2,
                y: upper.bottom - 1,
              };
            }
          }
        }
      }
      return null;
    });
    expect(pair, 'compact A–Z should wrap at least one letter group').not.toBeNull();
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await page.mouse.click(pair!.x, pair!.y);
    await expect(page).toHaveURL(new RegExp(`${escape(pair!.upperHref)}$`));
    await expect(page).not.toHaveURL(new RegExp(`${escape(pair!.lowerHref)}$`));
  });

  test('returning from Tags does not put a Continue strip on Discover', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemoGuest(page);
    await page.goto('/tags');
    await expect(page.getByRole('heading', { level: 1, name: /Ετικέτες|Tags/ })).toBeVisible();
    await page.goto('/');
    await expect(page.locator('#main-content .nakamas-card').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('region', { name: /Συνέχεια από εκεί που σταμάτησες|Continue where you left off/ }),
    ).toHaveCount(0);
  });
});

