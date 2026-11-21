import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

for (const width of [1024, 1152, 1280]) {
  test.describe(`Desktop header at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('every header control stays on screen and clear of the page title', async ({ page }) => {
      await enterDemoGuest(page);
      await page.goto('/chats');
      const nav = page.locator('nav.z-topnav');
      await expect(nav).toBeVisible({ timeout: 15_000 });
      const boxes = await nav.evaluate((el) => {
        const [left, right] = el.children;
        const titleRight = left.getBoundingClientRect().right;
        const controls = [...right.querySelectorAll('button, a, input')]
          .map((c) => c.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .map((b) => ({ left: b.left, right: b.right }));
        return { titleRight, controls, vw: window.innerWidth };
      });
      expect(boxes.controls.length).toBeGreaterThan(3);
      for (const b of boxes.controls) {
        expect(b.right).toBeLessThanOrEqual(boxes.vw);
        expect(b.left).toBeGreaterThanOrEqual(boxes.titleRight);
      }
      await expect(page.getByRole('button', { name: /^Ειδοποιήσεις|^Notifications/ })).toBeInViewport();
    });
  });
}
