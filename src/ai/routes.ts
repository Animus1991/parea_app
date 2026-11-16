import { hasAny } from './text';

export interface AppRoute {
  id: string;
  path: string;
  labelEl: string;
  labelEn: string;
  /** Normalized bilingual stems used by the local engine and by the palette bridge. */
  stems: string[];
  adminOnly?: boolean;
}

/**
 * Single registry of user-facing destinations (Φ23). Used by the copilot
 * `navigate` action (and exposed to Gemini as an enum) so the AI can reach
 * every page that the side navigation offers.
 */
export const APP_ROUTES: AppRoute[] = [
  { id: 'home', path: '/', labelEl: 'Ανακάλυψη', labelEn: 'Discover', stems: ['αρχικη', 'ανακαλυψ', 'feed', 'home', 'discover'] },
  { id: 'categories', path: '/categories', labelEl: 'Κατηγορίες', labelEn: 'Categories', stems: ['κατηγορι', 'categor'] },
  { id: 'nearby', path: '/nearby', labelEl: 'Τοπικές Ομάδες', labelEn: 'Local Groups', stems: ['χαρτη', 'κοντα μου', 'τοπικεσ ομαδεσ', 'nearby', 'map', 'local groups'] },
  { id: 'agenda', path: '/agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar', stems: ['ημερολογ', 'ατζεντα', 'calendar', 'agenda', 'schedule'] },
  { id: 'plans', path: '/plans', labelEl: 'Τα Σχέδιά μου', labelEn: 'My Plans', stems: ['σχεδια μου', 'τα σχεδια', 'my plans', 'plans'] },
  { id: 'buddy-seek', path: '/buddy-seek', labelEl: 'Βρες Nakamas', labelEn: 'Find Nakamas', stems: ['βρεσ nakamas', 'βρεσ παρεα', 'buddy', 'find nakamas', 'find company', 'plans forming'] },
  { id: 'saved', path: '/saved', labelEl: 'Αποθηκευμένες', labelEn: 'Saved', stems: ['αποθηκευμεν', 'saved', 'bookmarks'] },
  { id: 'history', path: '/history', labelEl: 'Ιστορικό', labelEn: 'History', stems: ['ιστορικ', 'history', 'past events'] },
  { id: 'connections', path: '/connections', labelEl: 'Οι Nakamas μου', labelEn: 'My Nakamas', stems: ['nakamas μου', 'φιλοι', 'φιλουσ', 'συνδεσεισ', 'connections', 'friends', 'my nakamas'] },
  { id: 'wall', path: '/wall', labelEl: 'Τοίχος Nakamas', labelEn: 'Nakamas Wall', stems: ['τοιχο', 'τοιχοσ', 'δημοσιευσ', 'ροη nakamas', 'wall', 'news feed', 'posts', 'timeline'] },
  { id: 'chats', path: '/chats', labelEl: 'Συνομιλίες', labelEn: 'Chats', stems: ['συνομιλι', 'μηνυματα', 'inbox', 'chats', 'messages'] },
  { id: 'manage', path: '/manage', labelEl: 'Πίνακας Διοργανωτή', labelEn: 'Organizer Dashboard', stems: ['διοργανωτ', 'organizer', 'dashboard', 'manage'] },
  { id: 'create', path: '/create', labelEl: 'Δημιουργία Εκδήλωσης', labelEn: 'Create Event', stems: ['δημιουργια εκδηλωσ', 'create event', 'new event'] },
  { id: 'wallet', path: '/wallet', labelEl: 'Πορτοφόλι', labelEn: 'Wallet', stems: ['πορτοφολ', 'κερδη', 'πληρωμ', 'wallet', 'earnings', 'payout'] },
  { id: 'verification', path: '/verification', labelEl: 'Επαλήθευση Ταυτότητας', labelEn: 'Identity Verification', stems: ['επαληθευσ', 'ταυτοτητ', 'verification', 'verify'] },
  { id: 'trust', path: '/trust', labelEl: 'Κέντρο Εμπιστοσύνης', labelEn: 'Trust Center', stems: ['εμπιστοσυν', 'trust center', 'trust'] },
  { id: 'report', path: '/report', labelEl: 'Αναφορά Προβλήματος', labelEn: 'Report Issue', stems: ['αναφορα προβλ', 'report issue', 'report a problem'] },
  { id: 'profile', path: '/profile', labelEl: 'Το Προφίλ μου', labelEn: 'My Profile', stems: ['προφιλ', 'profile'] },
  { id: 'notifications', path: '/notifications', labelEl: 'Ειδοποιήσεις', labelEn: 'Notifications', stems: ['ειδοποιησ', 'notification', 'alerts'] },
  { id: 'settings', path: '/settings', labelEl: 'Ρυθμίσεις & Απόρρητο', labelEn: 'Settings & Privacy', stems: ['ρυθμισ', 'απορρητ', 'settings', 'privacy', 'preferences'] },
  { id: 'help', path: '/help', labelEl: 'Κέντρο Βοήθειας', labelEn: 'Help Center', stems: ['κεντρο βοηθει', 'help center', 'faq', 'support'] },
  { id: 'achievements', path: '/achievements', labelEl: 'Επιτεύγματα', labelEn: 'Achievements', stems: ['επιτευγμα', 'badges', 'achievement', 'xp'] },
  { id: 'leaderboard', path: '/leaderboard', labelEl: 'Κατάταξη', labelEn: 'Leaderboard', stems: ['καταταξ', 'leaderboard', 'ranking'] },
  { id: 'challenges', path: '/challenges', labelEl: 'Προκλήσεις', labelEn: 'Challenges', stems: ['προκλησ', 'challenge'] },
  { id: 'onboarding', path: '/onboarding', labelEl: 'Οδηγός Εισαγωγής', labelEn: 'Onboarding', stems: ['οδηγοσ εισαγωγ', 'onboarding'] },
  { id: 'admin', path: '/admin', labelEl: 'Διαχείριση', labelEn: 'Admin', stems: ['admin', 'διαχειρισ', 'moderation'], adminOnly: true },
];

export function routeById(id: string): AppRoute | undefined {
  return APP_ROUTES.find((r) => r.id === id || r.path === id);
}

/** Best route for a normalized phrase (longest stem wins to prefer «σχέδια μου» over «σχέδια»). */
export function matchRoute(normalizedText: string, isAdmin: boolean): AppRoute | null {
  let best: { route: AppRoute; len: number } | null = null;
  for (const route of APP_ROUTES) {
    if (route.adminOnly && !isAdmin) continue;
    for (const stem of route.stems) {
      if (normalizedText.includes(stem) && (!best || stem.length > best.len)) {
        best = { route, len: stem.length };
      }
    }
  }
  return best?.route ?? null;
}

/** Pathname → route id (for page-aware suggestions and the model context). */
export function routeIdForPath(pathname: string): string {
  if (pathname.startsWith('/events/')) return pathname.endsWith('/join') ? 'join' : 'event';
  if (pathname.startsWith('/chat/')) return 'chat';
  if (pathname.startsWith('/organizer/')) return 'organizer-profile';
  if (pathname.startsWith('/u/')) return 'person-profile';
  if (pathname.startsWith('/history/feedback')) return 'feedback';
  const exact = APP_ROUTES.find((r) => r.path === pathname);
  if (exact) return exact.id;
  return hasAny(pathname, ['/calendar']) ? 'agenda' : 'other';
}
