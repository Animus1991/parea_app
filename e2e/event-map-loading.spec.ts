import { test, expect } from '@playwright/test';
import { enterDemoGuest } from './a11y-helpers';

for (const coordinates of [true, false]) {
  test(`event mini-map loads on opening only (coordinates: ${coordinates})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const modules: string[] = [];
    page.on('request', (request) => modules.push(request.url()));
    await enterDemoGuest(page);
    await page.evaluate((coordinates) => {
      const key = 'nakamas-store-v1';
      const stored = JSON.parse(localStorage.getItem(key)!);
      const now = new Date(Date.now() + 15 * 60 * 1000);
      const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const id = 'map-loading-fixture';
      stored.state.events.push({ ...stored.state.events[0], id, title: 'Map loading fixture', date, time,
        lat: coordinates ? 37.97 : undefined, lng: coordinates ? 23.72 : undefined });
      stored.state.groups.push({ id: 'map-loading-group', eventId: id, members: [stored.state.currentUserId], pendingMembers: [], targetSize: 4, status: 'confirmed', discountUnlocked: false });
      stored.state.savedEvents = [id];
      localStorage.setItem(key, JSON.stringify(stored));
    }, coordinates);
    await page.goto('/categories?q=Map%20loading%20fixture');
    const card = page.locator('.nakamas-card').filter({ hasText: 'Map loading fixture' });
    const map = card.getByRole('button', { name: /Χάρτης ομάδας|Group map/ }).first();
    await expect(map).toBeVisible();
    expect(modules.some((url) => url.includes('/EventCardMiniMap.tsx'))).toBe(false);
    expect(modules.some((url) => /react-leaflet|leafletDefaultIcon/.test(url))).toBe(false);
    await map.click();
    const sheet = page.getByRole('dialog', { name: /Άφιξη & χάρτης|Arrival & map/ });
    await expect(sheet).toBeVisible();
    if (coordinates) {
      await expect(sheet.locator('.leaflet-container')).toBeVisible();
      expect(modules.some((url) => url.includes('/EventCardMiniMap.tsx'))).toBe(true);
      await expect(sheet.locator('.leaflet-marker-icon')).toBeVisible();
    } else {
      await expect(sheet.locator('.leaflet-container')).toHaveCount(0);
      expect(modules.some((url) => url.includes('/EventCardMiniMap.tsx'))).toBe(false);
    }
    await sheet.getByRole('button', { name: /Κλείσιμο|Close/, exact: true }).last().click();
    await expect(sheet).toHaveCount(0);
  });
}
