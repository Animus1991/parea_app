import { describe, expect, it } from 'vitest';
import {
  BOTTOM_TAB_PATHS,
  QUICK_NAV_TILES,
  isBottomSwipeGestureStart,
  isBottomSwipeOrigin,
  isBottomSwipeSheet,
  isDownwardCloseSwipe,
  isUpwardOpenSwipe,
  quickNavDestinations,
} from './bottomSwipeQuickNav';

describe('bottom swipe gesture', () => {
  it('opens on a clear upward swipe from the tabs', () => {
    expect(isUpwardOpenSwipe({ dx: 0, dy: -80 })).toBe(true);
    expect(isUpwardOpenSwipe({ dx: 12, dy: -40 })).toBe(true);
  });

  it('ignores taps and shallow flicks', () => {
    expect(isUpwardOpenSwipe({ dx: 0, dy: -8 })).toBe(false);
    expect(isUpwardOpenSwipe({ dx: 0, dy: -24 })).toBe(false);
  });

  it('ignores a mostly horizontal slide across tabs', () => {
    expect(isUpwardOpenSwipe({ dx: 80, dy: -20 })).toBe(false);
    expect(isUpwardOpenSwipe({ dx: -90, dy: -50 })).toBe(false);
  });

  it('closes on a clear downward swipe', () => {
    expect(isDownwardCloseSwipe({ dx: 4, dy: 64 })).toBe(true);
    expect(isDownwardCloseSwipe({ dx: 0, dy: 20 })).toBe(false);
    expect(isDownwardCloseSwipe({ dx: 80, dy: 40 })).toBe(false);
  });
});

describe('quickNavDestinations', () => {
  it('never repeats the five default bottom tabs', () => {
    const paths = quickNavDestinations({ isAdmin: true, isOrganizer: true }).map((t) => t.path);
    for (const tab of BOTTOM_TAB_PATHS) {
      expect(paths).not.toContain(tab);
    }
  });

  it('keeps daily pages and hides one-time support routes', () => {
    const ids = quickNavDestinations().map((t) => t.id);
    expect(ids).toContain('categories');
    expect(ids).toContain('nearby');
    expect(ids).toContain('settings');
    expect(ids).not.toContain('onboarding');
    expect(ids).not.toContain('report');
  });

  it('hides admin and organizer tiles unless the role matches', () => {
    const guest = quickNavDestinations().map((t) => t.id);
    expect(guest).not.toContain('admin');
    expect(guest).not.toContain('manage');
    expect(quickNavDestinations({ isOrganizer: true }).map((t) => t.id)).toContain('manage');
    expect(quickNavDestinations({ isAdmin: true }).map((t) => t.id)).toContain('admin');
  });

  it('defines every tile with a unique path', () => {
    const paths = QUICK_NAV_TILES.map((t) => t.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('isBottomSwipeOrigin', () => {
  it('accepts the existing bottom chrome and ignores the rest of the page', () => {
    const nav = document.createElement('div');
    nav.setAttribute('data-bottom-swipe-origin', '');
    const icon = document.createElement('svg');
    nav.appendChild(icon);
    const elsewhere = document.createElement('main');
    expect(isBottomSwipeOrigin(icon)).toBe(true);
    expect(isBottomSwipeOrigin(nav)).toBe(true);
    expect(isBottomSwipeOrigin(elsewhere)).toBe(false);
    expect(isBottomSwipeOrigin(null)).toBe(false);
  });
});

describe('isBottomSwipeSheet / gesture start', () => {
  it('closes only from the expanded sheet, not the dimmed page or the tabs', () => {
    const sheet = document.createElement('div');
    sheet.setAttribute('data-bottom-swipe-sheet', '');
    const tile = document.createElement('a');
    sheet.appendChild(tile);
    const nav = document.createElement('div');
    nav.setAttribute('data-bottom-swipe-origin', '');
    const dimmed = document.createElement('button');
    expect(isBottomSwipeSheet(tile)).toBe(true);
    expect(isBottomSwipeSheet(nav)).toBe(false);
    expect(isBottomSwipeSheet(dimmed)).toBe(false);
    expect(isBottomSwipeGestureStart(nav, false)).toBe(true);
    expect(isBottomSwipeGestureStart(tile, false)).toBe(false);
    expect(isBottomSwipeGestureStart(tile, true)).toBe(true);
    expect(isBottomSwipeGestureStart(nav, true)).toBe(false);
    expect(isBottomSwipeGestureStart(dimmed, true)).toBe(false);
  });
});
