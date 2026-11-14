import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** High-traffic routes for page × theme matrix (not every app route). */
export const A11Y_ROUTES = [
  { path: '/login', needsAuth: false, name: 'login' },
  { path: '/', needsAuth: true, name: 'home' },
  { path: '/connections', needsAuth: true, name: 'connections' },
  { path: '/chats', needsAuth: true, name: 'chats' },
  { path: '/settings', needsAuth: true, name: 'settings' },
  { path: '/help', needsAuth: true, name: 'help' },
  { path: '/wallet', needsAuth: true, name: 'wallet' },
  { path: '/nearby', needsAuth: true, name: 'nearby' },
  { path: '/buddy-seek', needsAuth: true, name: 'buddy-seek' },
  { path: '/notifications', needsAuth: true, name: 'notifications' },
  // Added after the 2026-11-14 audit (§8 #7): detail, calendar, create, admin.
  { path: '/events/e1', needsAuth: true, name: 'event-detail' },
  { path: '/agenda', needsAuth: true, name: 'agenda' },
  { path: '/create', needsAuth: true, name: 'create' },
  { path: '/admin', needsAuth: true, name: 'admin', asAdmin: true },
] as const;

/**
 * CI hard-gate themes (contrast + structural).
 * Full 9-theme sweep: `npx playwright test e2e/a11y.spec.ts -g "theme="`
 * Representative set keeps CI under ~10m while covering light/dark/AB.
 */
export const A11Y_THEMES_CI = [
  'classic',
  'bento',
  'neon',
  'vibrant-dark',
  'activebuddies-dark',
] as const;

/** Full product theme list (local exhaustive runs). */
export const A11Y_THEMES = [
  'classic',
  'vibrant',
  'bento',
  'neon',
  'vibrant-dark',
  'bento-dark',
  'neon-dark',
  'activebuddies',
  'activebuddies-dark',
] as const;

const STORE_KEY = 'nakamas-store-v1';

/** Patch persisted zustand theme before first paint. */
export async function seedTheme(page: Page, theme: string) {
  await page.addInitScript(
    ({ key, themeId }) => {
      try {
        const raw = localStorage.getItem(key);
        const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
        data.state = { ...(data.state ?? {}), theme: themeId };
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        localStorage.setItem(key, JSON.stringify({ state: { theme: themeId }, version: 0 }));
      }
    },
    { key: STORE_KEY, themeId: theme },
  );
}

/** Signs in with the seeded demo moderator (the only demo account with Admin access). */
export async function enterDemoAdmin(page: Page) {
  await page.goto('/login');
  // Demo accounts go through onboarding first; mark it done so the test lands in the app.
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    data.state = { ...(data.state ?? {}), onboardingCompleted: true };
    localStorage.setItem(key, JSON.stringify(data));
  }, STORE_KEY);
  await page.reload();
  await page.getByRole('button', { name: /Συντονιστής|Moderator/ }).first().click();
  await expect(page.locator('#main-content')).toBeVisible();
}

export async function enterDemoGuest(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#main-content')).toBeVisible();
}

/**
 * Axe WCAG tags — serious/critical only.
 * @param includeColorContrast when true, pixel-level contrast is enforced (matrix).
 */
export async function expectNoSeriousAxeViolations(
  page: Page,
  opts: { includeColorContrast?: boolean } = {},
) {
  // Entrance animations (fade/slide-in) make axe sample half-transparent colours and
  // report flaky contrast failures. The app honours prefers-reduced-motion globally,
  // so scanning under reduced motion measures the final, user-visible colours.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), undefined, { timeout: 3000 })
    .catch(() => undefined);
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    // Leaflet pins overlap by design on dense maps — not app chrome controls.
    .exclude('.leaflet-marker-icon')
    .exclude('.leaflet-control-zoom a')
    .exclude('.leaflet-control-attribution');
  if (!opts.includeColorContrast) {
    builder = builder.disableRules(['color-contrast']);
  }
  const results = await builder.analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(
    serious,
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n'),
  ).toEqual([]);
}
