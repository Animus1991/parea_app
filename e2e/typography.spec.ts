import { test, expect, type Page } from '@playwright/test';

/**
 * Type hierarchy guard: a page or card title is never smaller than the text
 * right under it. Small bold section labels (10 px, letter-spaced) above
 * content are a deliberate pattern and are not titles, so they are not checked.
 */

const ROUTES = ['/', '/categories', '/buddy-seek', '/nearby', '/plans', '/connections', '/challenges', '/leaderboard', '/help', '/report', '/events/e1', '/organizer/org1', '/does-not-exist'];

async function titleOffenders(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('#main-content') ?? document.body;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
    const ownText = (el: Element) =>
      [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim() ?? '').join(' ').trim();
    const firstText = (root: Element): Element | null => {
      const queue: Element[] = [root];
      while (queue.length) {
        const el = queue.shift()!;
        if (!visible(el)) continue;
        if (el.matches('button,a,input,select,textarea,svg,img,[role=button],[role=tab],.sr-only,[aria-hidden=true]')) continue;
        if (el.matches('h1,h2,h3,h4')) return null;
        if (ownText(el).length >= 3) return el;
        queue.push(...el.children);
      }
      return null;
    };
    const out: string[] = [];
    for (const title of main.querySelectorAll('h1, .card-heading, .card-heading-lg')) {
      if (!visible(title) || (title.textContent?.trim().length ?? 0) < 2) continue;
      // What follows the title; climb wrappers that only hold the title.
      let node: Element = title;
      const following: Element[] = [];
      for (let level = 0; level < 3 && following.length === 0; level++) {
        let next = node.nextElementSibling;
        for (let i = 0; next && i < 2; i++, next = next.nextElementSibling) following.push(next);
        const parent = node.parentElement;
        if (following.length || !parent || parent === main || parent.textContent?.trim() !== title.textContent?.trim()) break;
        node = parent;
      }
      for (const el of following) {
        const text = firstText(el);
        if (text && size(text) > size(title) + 0.3) {
          out.push(`«${title.textContent?.trim().slice(0, 30)}» ${size(title)}px < «${ownText(text).slice(0, 30)}» ${size(text)}px`);
        }
      }
    }
    return out;
  });
}

test.describe('type hierarchy', () => {
  test('titles are never smaller than the text under them', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Explore as guest|Εξερεύνηση ως επισκέπτης/i }).click();
    await expect(page.getByRole('button', { name: /Μενού λογαριασμού|Account menu/ })).toBeVisible();
    const problems: string[] = [];
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator('#main-content')).toBeVisible();
      await page.waitForTimeout(400);
      for (const p of await titleOffenders(page)) problems.push(`${route}: ${p}`);
    }
    expect(problems).toEqual([]);
  });
});
