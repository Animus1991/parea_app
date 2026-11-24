import { test, expect, type Locator } from '@playwright/test';
import { enterDemoAdmin, enterDemoGuest, expectNoSeriousAxeViolations } from './a11y-helpers';

async function expectTouchTarget(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  const target = await control.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const after = getComputedStyle(el, '::after');
    const expanded = after.content !== 'none' && after.position === 'absolute';
    const top = expanded ? parseFloat(after.top) || 0 : 0;
    const width = Math.max(rect.width, expanded ? parseFloat(after.width) || 0 : 0);
    const height = Math.max(rect.height, expanded ? parseFloat(after.height) || 0 : 0);
    const y = rect.y + (parseFloat(style.borderTopWidth) || 0) + top + height - 2;
    const hit = document.elementFromPoint(rect.x + rect.width / 2, y);
    return { width, height, reachable: hit === el || el.contains(hit) };
  });
  expect(target.width).toBeGreaterThanOrEqual(40);
  expect(target.height).toBeGreaterThanOrEqual(40);
  expect(target.reachable).toBe(true);
}

test('mobile header, story colors and hat removal have effective 40px targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemoGuest(page);
  await expectTouchTarget(page.getByRole('button', { name: /^(Ρυθμίσεις|Settings)$/ }));
  await expectTouchTarget(page.getByRole('button', { name: /^(Ειδοποιήσεις|Notifications)( \(\d+\))?$/ }).first());
  await page.getByRole('button', { name: /Συνομιλίες σχεδίων|Plan chats/ }).click();
  await page.getByRole('dialog', { name: 'Nakamas Chat', exact: true }).getByRole('button', { name: /^(Ιστορία|Story)$/ }).click();
  const colors = page.getByRole('button', { name: /^(Χρώμα|Color) \d+$/ });
  expect(await colors.count()).toBeGreaterThan(1);
  for (const color of await colors.all()) await expectTouchTarget(color);
  await colors.nth(1).click();
  await expect(colors.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/settings?section=chat-icon');
  await expectTouchTarget(page.getByRole('button', { name: /Απόκρυψη:|Hide:/ }).first());
});

for (const language of ['el', 'en']) {
  test(`admin switches and audited admin copy are accessible in ${language}`, async ({ page }) => {
    await page.addInitScript((language) => localStorage.setItem('nakamas-language', JSON.stringify({ state: { language }, version: 0 })), language);
    await enterDemoAdmin(page);
    await page.goto('/admin');
    await page.getByRole('tab', { name: language === 'el' ? 'Αυτοματισμοί' : 'Automation', exact: true }).click();
    const switches = page.getByRole('switch');
    await expect(switches).toHaveCount(3);
    for (const control of await switches.all()) {
      await expect(control).toHaveAccessibleName(/.+/);
      await expectTouchTarget(control);
    }
    const before = await switches.first().getAttribute('aria-checked');
    await switches.first().click();
    await expect(switches.first()).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
    await expectNoSeriousAxeViolations(page, { includeColorContrast: false });
    await page.getByRole('tab', { name: 'SSO', exact: true }).click();
    await expect(page.getByRole('combobox', { name: language === 'el' ? 'Πάροχος' : 'Provider', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: language === 'el' ? 'Εταιρική ταυτότητα' : 'Branding', exact: true })).toBeVisible();
  });
}
