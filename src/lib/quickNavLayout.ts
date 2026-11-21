export type QuickNavRole = {
  isAdmin?: boolean;
  isOrganizer?: boolean;
};

/** Center FAB — always on the bar, never in the editable lists. */
export const QUICK_NAV_CREATE_ID = 'create';

/** How many editable shortcuts sit around Create on the bottom bar. */
export const QUICK_NAV_BAR_SLOTS = 4;

/** Keep at least this many bar shortcuts so the dock does not collapse. */
export const QUICK_NAV_MIN_BAR = 2;

export interface QuickNavTileDef {
  id: string;
  path: string;
  labelEl: string;
  labelEn: string;
  /** Shorter caption for the bottom bar. */
  barLabelEl?: string;
  barLabelEn?: string;
  organizerOnly?: boolean;
  adminOnly?: boolean;
  group: 'explore' | 'experience' | 'community' | 'host' | 'account' | 'support';
}

export const QUICK_NAV_GROUPS: { id: QuickNavTileDef['group']; el: string; en: string }[] = [
  { id: 'explore', el: 'Εξερεύνηση', en: 'Explore' },
  { id: 'experience', el: 'Η εμπειρία μου', en: 'My experience' },
  { id: 'community', el: 'Κοινότητα', en: 'Community' },
  { id: 'host', el: 'Διοργάνωση', en: 'Host' },
  { id: 'account', el: 'Λογαριασμός', en: 'Account' },
  { id: 'support', el: 'Υποστήριξη', en: 'Support' },
];

/**
 * Every page the user can pin to the bar or the swipe menu.
 * Create stays a dedicated FAB and is not listed here.
 */
export const QUICK_NAV_CATALOG: QuickNavTileDef[] = [
  { id: 'home', path: '/', labelEl: 'Ανακάλυψη', labelEn: 'Discover', group: 'explore' },
  { id: 'categories', path: '/categories', labelEl: 'Κατηγορίες', labelEn: 'Categories', group: 'explore' },
  { id: 'tags', path: '/tags', labelEl: 'Ετικέτες', labelEn: 'Tags', group: 'explore' },
  { id: 'collections', path: '/collections', labelEl: 'Συλλογές', labelEn: 'Collections', group: 'explore' },
  { id: 'nearby', path: '/nearby', labelEl: 'Τοπικές ομάδες', labelEn: 'Local Groups', group: 'explore' },
  { id: 'agenda', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar', group: 'experience' },
  { id: 'plans', path: '/plans', labelEl: 'Τα Σχέδιά μου', labelEn: 'My Plans', barLabelEl: 'Σχέδια', barLabelEn: 'Plans', group: 'experience' },
  { id: 'buddy-seek', path: '/buddy-seek', labelEl: 'Βρες Nakamas', labelEn: 'Find Nakamas', group: 'experience' },
  { id: 'saved', path: '/saved', labelEl: 'Αποθηκευμένες', labelEn: 'Saved', group: 'experience' },
  { id: 'history', path: '/history', labelEl: 'Ιστορικό', labelEn: 'History', group: 'experience' },
  { id: 'wall', path: '/wall', labelEl: 'Τοίχος Nakamas', labelEn: 'Nakamas Wall', barLabelEl: 'Τοίχος', barLabelEn: 'Wall', group: 'community' },
  { id: 'connections', path: '/connections', labelEl: 'Οι Nakamas μου', labelEn: 'My Nakamas', barLabelEl: 'Nakamas', barLabelEn: 'Nakamas', group: 'community' },
  { id: 'chats', path: '/chats', labelEl: 'Συνομιλίες', labelEn: 'Chats', group: 'community' },
  { id: 'leaderboard', path: '/leaderboard', labelEl: 'Κατάταξη', labelEn: 'Leaderboard', group: 'community' },
  { id: 'challenges', path: '/challenges', labelEl: 'Προκλήσεις', labelEn: 'Challenges', group: 'community' },
  { id: 'achievements', path: '/achievements', labelEl: 'Επιτεύγματα', labelEn: 'Achievements', group: 'community' },
  { id: 'manage', path: '/manage', labelEl: 'Διοργάνωση', labelEn: 'Host', organizerOnly: true, group: 'host' },
  { id: 'wallet', path: '/wallet', labelEl: 'Πορτοφόλι', labelEn: 'Wallet', group: 'host' },
  { id: 'profile', path: '/profile', labelEl: 'Το Προφίλ μου', labelEn: 'My Profile', barLabelEl: 'Προφίλ', barLabelEn: 'Profile', group: 'account' },
  { id: 'verification', path: '/verification', labelEl: 'Επαλήθευση', labelEn: 'Verification', group: 'account' },
  { id: 'trust', path: '/trust', labelEl: 'Αξιοπιστία', labelEn: 'Reliability', group: 'account' },
  { id: 'notifications', path: '/notifications', labelEl: 'Ειδοποιήσεις', labelEn: 'Notifications', group: 'account' },
  { id: 'settings', path: '/settings', labelEl: 'Ρυθμίσεις', labelEn: 'Settings', group: 'account' },
  { id: 'admin', path: '/admin', labelEl: 'Διαχείριση', labelEn: 'Admin', adminOnly: true, group: 'account' },
  { id: 'help', path: '/help', labelEl: 'Βοήθεια', labelEn: 'Help', group: 'support' },
  { id: 'report', path: '/report', labelEl: 'Αναφορά', labelEn: 'Report', group: 'support' },
  { id: 'onboarding', path: '/onboarding', labelEl: 'Οδηγός εισαγωγής', labelEn: 'Onboarding', group: 'support' },
];

export const QUICK_NAV_BY_ID = Object.fromEntries(QUICK_NAV_CATALOG.map((tile) => [tile.id, tile])) as Record<
  string,
  QuickNavTileDef
>;

/** The four default bar shortcuts (Create stays in the center). */
export const DEFAULT_QUICK_NAV_BAR_IDS = ['home', 'plans', 'connections', 'profile'] as const;

/** Default swipe-up pages — the previous fixed grid, minus anything already on the bar. */
export const DEFAULT_QUICK_NAV_SHEET_IDS = [
  'categories',
  'tags',
  'collections',
  'nearby',
  'agenda',
  'buddy-seek',
  'saved',
  'history',
  'wall',
  'chats',
  'leaderboard',
  'challenges',
  'manage',
  'wallet',
  'notifications',
  'settings',
  'verification',
  'trust',
  'help',
  'admin',
] as const;

export const DEFAULT_QUICK_NAV_ACTIVE = [...DEFAULT_QUICK_NAV_BAR_IDS, ...DEFAULT_QUICK_NAV_SHEET_IDS];

export interface QuickNavLayout {
  /** Ordered shortcuts. The first {@link QUICK_NAV_BAR_SLOTS} sit on the bar; the rest in the swipe menu. */
  active: string[];
}

export const DEFAULT_QUICK_NAV_LAYOUT: QuickNavLayout = { active: [...DEFAULT_QUICK_NAV_ACTIVE] };

export function tileAllowed(tile: QuickNavTileDef, role: QuickNavRole = {}): boolean {
  if (tile.adminOnly && !role.isAdmin) return false;
  if (tile.organizerOnly && !role.isOrganizer) return false;
  return true;
}

export function catalogForRole(role: QuickNavRole = {}): QuickNavTileDef[] {
  return QUICK_NAV_CATALOG.filter((tile) => tileAllowed(tile, role));
}

function uniqueKnown(ids: string[], role: QuickNavRole): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (id === QUICK_NAV_CREATE_ID || seen.has(id)) continue;
    const tile = QUICK_NAV_BY_ID[id];
    if (!tile || !tileAllowed(tile, role)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function sanitizeQuickNavLayout(
  layout: QuickNavLayout | null | undefined,
  role: QuickNavRole = {},
): QuickNavLayout {
  const active = uniqueKnown(layout?.active ?? DEFAULT_QUICK_NAV_ACTIVE, role);
  if (active.length >= QUICK_NAV_MIN_BAR) return { active };
  const fill = uniqueKnown([...active, ...DEFAULT_QUICK_NAV_ACTIVE], role);
  return { active: fill };
}

export function splitQuickNav(
  layout: QuickNavLayout,
  role: QuickNavRole = {},
): { bar: QuickNavTileDef[]; sheet: QuickNavTileDef[]; available: QuickNavTileDef[] } {
  const { active } = sanitizeQuickNavLayout(layout, role);
  const barIds = active.slice(0, QUICK_NAV_BAR_SLOTS);
  const sheetIds = active.slice(QUICK_NAV_BAR_SLOTS);
  const used = new Set(active);
  return {
    bar: barIds.map((id) => QUICK_NAV_BY_ID[id]),
    sheet: sheetIds.map((id) => QUICK_NAV_BY_ID[id]),
    available: catalogForRole(role).filter((tile) => !used.has(tile.id)),
  };
}

export function addQuickNavTile(layout: QuickNavLayout, id: string, role: QuickNavRole = {}): QuickNavLayout {
  const { active } = sanitizeQuickNavLayout(layout, role);
  const tile = QUICK_NAV_BY_ID[id];
  if (!tile || !tileAllowed(tile, role) || id === QUICK_NAV_CREATE_ID) return { active };
  if (active.includes(id)) return { active };
  return { active: [...active, id] };
}

export function removeQuickNavTile(layout: QuickNavLayout, id: string, role: QuickNavRole = {}): QuickNavLayout {
  const { active } = sanitizeQuickNavLayout(layout, role);
  if (!active.includes(id)) return { active };
  if (active.length <= QUICK_NAV_MIN_BAR) return { active };
  return { active: active.filter((item) => item !== id) };
}

export function moveQuickNavTile(
  layout: QuickNavLayout,
  fromIndex: number,
  toIndex: number,
  role: QuickNavRole = {},
): QuickNavLayout {
  const { active } = sanitizeQuickNavLayout(layout, role);
  if (fromIndex === toIndex) return { active };
  if (fromIndex < 0 || fromIndex >= active.length) return { active };
  const next = [...active];
  const [item] = next.splice(fromIndex, 1);
  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, item);
  return { active: next };
}

export function pinQuickNavToBar(layout: QuickNavLayout, id: string, role: QuickNavRole = {}): QuickNavLayout {
  const { active } = sanitizeQuickNavLayout(layout, role);
  const tile = QUICK_NAV_BY_ID[id];
  if (!tile || !tileAllowed(tile, role) || id === QUICK_NAV_CREATE_ID) return { active };
  const without = active.filter((item) => item !== id);
  return { active: [id, ...without] };
}

export function barCaption(tile: QuickNavTileDef): { el: string; en: string } {
  return {
    el: tile.barLabelEl ?? tile.labelEl,
    en: tile.barLabelEn ?? tile.labelEn,
  };
}
