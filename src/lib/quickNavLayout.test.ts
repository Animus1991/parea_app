import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUICK_NAV_LAYOUT,
  QUICK_NAV_BAR_SLOTS,
  QUICK_NAV_CATALOG,
  QUICK_NAV_MIN_BAR,
  addQuickNavTile,
  moveQuickNavTile,
  pinQuickNavToBar,
  removeQuickNavTile,
  sanitizeQuickNavLayout,
  splitQuickNav,
} from './quickNavLayout';

describe('sanitizeQuickNavLayout', () => {
  it('drops unknown, duplicate, and Create ids', () => {
    const { active } = sanitizeQuickNavLayout({
      active: ['home', 'home', 'create', 'nope', 'plans', 'connections'],
    });
    expect(active).toEqual(['home', 'plans', 'connections']);
  });

  it('hides admin and organizer tiles unless the role matches', () => {
    const guest = sanitizeQuickNavLayout({ active: ['home', 'plans', 'admin', 'manage'] }, {});
    expect(guest.active).not.toContain('admin');
    expect(guest.active).not.toContain('manage');
    expect(sanitizeQuickNavLayout({ active: ['home', 'admin'] }, { isAdmin: true }).active).toContain('admin');
  });

  it('fills back to the default bar when too few shortcuts remain', () => {
    const { active } = sanitizeQuickNavLayout({ active: ['chats'] });
    expect(active.length).toBeGreaterThanOrEqual(QUICK_NAV_MIN_BAR);
    expect(active[0]).toBe('chats');
  });
});

describe('splitQuickNav', () => {
  it('puts the first four on the bar and the rest in the swipe menu', () => {
    const { bar, sheet, available } = splitQuickNav(DEFAULT_QUICK_NAV_LAYOUT);
    expect(bar).toHaveLength(QUICK_NAV_BAR_SLOTS);
    expect(bar.map((t) => t.id)).toEqual(['home', 'plans', 'connections', 'profile']);
    expect(sheet.map((t) => t.id)).toContain('categories');
    expect(sheet.map((t) => t.id)).not.toContain('home');
    expect(available.map((t) => t.id)).toContain('report');
    expect(available.map((t) => t.id)).toContain('onboarding');
    expect(available.map((t) => t.id)).toContain('achievements');
  });

  it('never lists a shortcut in two zones', () => {
    const { bar, sheet, available } = splitQuickNav(DEFAULT_QUICK_NAV_LAYOUT, { isAdmin: true, isOrganizer: true });
    const ids = [...bar, ...sheet, ...available].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(QUICK_NAV_CATALOG.length);
  });
});

describe('add / remove / move', () => {
  it('adds an available page to the swipe menu and can pin it onto the bar', () => {
    const added = addQuickNavTile(DEFAULT_QUICK_NAV_LAYOUT, 'report');
    expect(splitQuickNav(added).sheet.map((t) => t.id)).toContain('report');
    const pinned = pinQuickNavToBar(added, 'report');
    expect(splitQuickNav(pinned).bar[0].id).toBe('report');
    expect(splitQuickNav(pinned).bar.map((t) => t.id)).not.toContain('profile');
    expect(splitQuickNav(pinned).sheet.map((t) => t.id)).toContain('profile');
  });

  it('refuses to strip the bar below the minimum', () => {
    let layout = { active: ['home', 'plans'] };
    layout = removeQuickNavTile(layout, 'home');
    expect(layout.active).toEqual(['home', 'plans']);
  });

  it('reorders so a swipe tile can become a bar tile', () => {
    const next = moveQuickNavTile(DEFAULT_QUICK_NAV_LAYOUT, 4, 0);
    expect(next.active[0]).toBe('categories');
    expect(splitQuickNav(next).bar[0].id).toBe('categories');
  });
});
