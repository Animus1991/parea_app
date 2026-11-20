/**
 * Hidden swipe-up destinations from the existing mobile bottom tabs.
 *
 * Closed state is identical to the previous bottom nav: no extra tab, handle,
 * or icons. Swipe up on those tabs to open a sheet of the remaining pages.
 *
 * Kill switch: set `BOTTOM_SWIPE_QUICK_NAV_ENABLED` to `false` to restore the
 * previous UI with no leftover chrome. The BottomNav markup stays unchanged.
 */

import {
  DEFAULT_QUICK_NAV_LAYOUT,
  QUICK_NAV_CATALOG,
  splitQuickNav,
  type QuickNavLayout,
  type QuickNavRole,
} from './quickNavLayout';

export const BOTTOM_SWIPE_QUICK_NAV_ENABLED = true;

/** Mark the existing bottom chrome as the swipe-up start zone (no extra UI). */
export const BOTTOM_SWIPE_ORIGIN_SELECTOR = '[data-bottom-swipe-origin]';

/** The expanded sheet only — swipe-down close does not use the dimmed page. */
export const BOTTOM_SWIPE_SHEET_SELECTOR = '[data-bottom-swipe-sheet]';

export function isBottomSwipeOrigin(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(BOTTOM_SWIPE_ORIGIN_SELECTOR));
}

export function isBottomSwipeSheet(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(BOTTOM_SWIPE_SHEET_SELECTOR));
}

/** Closed: swipe up from the tabs. Open: swipe down only on the sheet itself. */
export function isBottomSwipeGestureStart(target: EventTarget | null, sheetOpen: boolean): boolean {
  return sheetOpen ? isBottomSwipeSheet(target) : isBottomSwipeOrigin(target);
}

/** Upward movement (px) required before a gesture opens the sheet. */
export const SWIPE_OPEN_PX = 36;

/** Downward movement (px) required before a gesture closes the sheet. */
export const SWIPE_CLOSE_PX = 48;

/** |dy| must beat |dx| by this factor so a tab-slide is not an open. */
export const SWIPE_AXIS_RATIO = 1.25;

export interface SwipeDelta {
  dx: number;
  dy: number;
}

export function isUpwardOpenSwipe({ dx, dy }: SwipeDelta): boolean {
  if (dy > -SWIPE_OPEN_PX) return false;
  return Math.abs(dy) >= Math.abs(dx) * SWIPE_AXIS_RATIO;
}

export function isDownwardCloseSwipe({ dx, dy }: SwipeDelta): boolean {
  if (dy < SWIPE_CLOSE_PX) return false;
  return Math.abs(dy) >= Math.abs(dx) * SWIPE_AXIS_RATIO;
}

/** Default five destinations on the mobile bottom tabs (Create stays pinned). */
export const BOTTOM_TAB_PATHS = ['/', '/plans', '/create', '/connections', '/profile'] as const;

export type { QuickNavLayout, QuickNavRole, QuickNavTileDef } from './quickNavLayout';
export { QUICK_NAV_CATALOG as QUICK_NAV_TILES };

export function quickNavDestinations(
  role: QuickNavRole = {},
  layout: QuickNavLayout = DEFAULT_QUICK_NAV_LAYOUT,
) {
  return splitQuickNav(layout, role).sheet;
}

/** Swallow the click that would follow a swipe, but only inside `within` (the tab bar). */
export function suppressClickOnce(within?: ParentNode | null, ms = 500): void {
  if (typeof document === 'undefined') return;
  const prevent = (event: Event) => {
    const target = event.target;
    if (within && target instanceof Node && !within.contains(target)) {
      document.removeEventListener('click', prevent, true);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('click', prevent, true);
  };
  document.addEventListener('click', prevent, true);
  window.setTimeout(() => document.removeEventListener('click', prevent, true), ms);
}
