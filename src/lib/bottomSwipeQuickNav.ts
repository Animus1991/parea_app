/**
 * Hidden swipe-up destinations from the existing mobile bottom tabs.
 *
 * Closed state is identical to the previous bottom nav: no extra tab, handle,
 * or icons. Swipe up on those tabs to open a sheet of the remaining pages.
 *
 * Kill switch: set `BOTTOM_SWIPE_QUICK_NAV_ENABLED` to `false` to restore the
 * previous UI with no leftover chrome. The BottomNav markup stays unchanged.
 */

export const BOTTOM_SWIPE_QUICK_NAV_ENABLED = true;

/** Mark the existing bottom chrome as the swipe-up start zone (no extra UI). */
export const BOTTOM_SWIPE_ORIGIN_SELECTOR = '[data-bottom-swipe-origin]';

export function isBottomSwipeOrigin(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(BOTTOM_SWIPE_ORIGIN_SELECTOR));
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

/** The five destinations already on the mobile bottom tabs — not repeated here. */
export const BOTTOM_TAB_PATHS = ['/', '/plans', '/create', '/connections', '/profile'] as const;

export type QuickNavRole = {
  isAdmin?: boolean;
  isOrganizer?: boolean;
};

export interface QuickNavTileDef {
  id: string;
  path: string;
  labelEl: string;
  labelEn: string;
  organizerOnly?: boolean;
  adminOnly?: boolean;
}

/**
 * Burger destinations that are worth one-thumb reach and are not already a
 * bottom tab. Onboarding / report stay in the burger only.
 */
export const QUICK_NAV_TILES: QuickNavTileDef[] = [
  { id: 'categories', path: '/categories', labelEl: 'Κατηγορίες', labelEn: 'Categories' },
  { id: 'collections', path: '/collections', labelEl: 'Συλλογές', labelEn: 'Collections' },
  { id: 'nearby', path: '/nearby', labelEl: 'Τοπικές Ομάδες', labelEn: 'Local Groups' },
  { id: 'agenda', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar' },
  { id: 'buddy-seek', path: '/buddy-seek', labelEl: 'Βρες Nakamas', labelEn: 'Find Nakamas' },
  { id: 'saved', path: '/saved', labelEl: 'Αποθηκευμένες', labelEn: 'Saved' },
  { id: 'history', path: '/history', labelEl: 'Ιστορικό', labelEn: 'History' },
  { id: 'wall', path: '/wall', labelEl: 'Τοίχος', labelEn: 'Wall' },
  { id: 'chats', path: '/chats', labelEl: 'Συνομιλίες', labelEn: 'Chats' },
  { id: 'leaderboard', path: '/leaderboard', labelEl: 'Κατάταξη', labelEn: 'Leaderboard' },
  { id: 'challenges', path: '/challenges', labelEl: 'Προκλήσεις', labelEn: 'Challenges' },
  { id: 'manage', path: '/manage', labelEl: 'Διοργάνωση', labelEn: 'Host', organizerOnly: true },
  { id: 'wallet', path: '/wallet', labelEl: 'Πορτοφόλι', labelEn: 'Wallet' },
  { id: 'notifications', path: '/notifications', labelEl: 'Ειδοποιήσεις', labelEn: 'Notifications' },
  { id: 'settings', path: '/settings', labelEl: 'Ρυθμίσεις', labelEn: 'Settings' },
  { id: 'verification', path: '/verification', labelEl: 'Επαλήθευση', labelEn: 'Verification' },
  { id: 'trust', path: '/trust', labelEl: 'Αξιοπιστία', labelEn: 'Reliability' },
  { id: 'help', path: '/help', labelEl: 'Βοήθεια', labelEn: 'Help' },
  { id: 'admin', path: '/admin', labelEl: 'Διαχείριση', labelEn: 'Admin', adminOnly: true },
];

export function quickNavDestinations(role: QuickNavRole = {}): QuickNavTileDef[] {
  return QUICK_NAV_TILES.filter((tile) => {
    if ((BOTTOM_TAB_PATHS as readonly string[]).includes(tile.path)) return false;
    if (tile.adminOnly && !role.isAdmin) return false;
    if (tile.organizerOnly && !role.isOrganizer) return false;
    return true;
  });
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
