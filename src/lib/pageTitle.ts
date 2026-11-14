import { APP_ROUTES } from '../ai/routes';

/**
 * Name of the current screen for the top bar (was a fixed «Πίνακας Ελέγχου»
 * on every page). Same labels as the side navigation and Nakamas AI, so the
 * user always sees where they are in the words they clicked.
 */
export function pageTitleForPath(pathname: string): { el: string; en: string } {
  const exact = APP_ROUTES.find((r) => r.path === pathname);
  if (exact) return { el: exact.labelEl, en: exact.labelEn };
  if (/^\/events\/[^/]+\/join/.test(pathname)) return { el: 'Συμμετοχή σε ομάδα', en: 'Join a group' };
  if (pathname.startsWith('/events/')) return { el: 'Εκδήλωση', en: 'Event' };
  if (pathname.startsWith('/chat/')) return { el: 'Συνομιλία ομάδας', en: 'Group chat' };
  if (pathname.startsWith('/organizer/')) return { el: 'Διοργανωτής', en: 'Organizer' };
  if (pathname.startsWith('/history/feedback')) return { el: 'Αξιολόγηση', en: 'Feedback' };
  if (pathname === '/calendar') return { el: 'Ημερολόγιο', en: 'Calendar' };
  return { el: 'Nakamas', en: 'Nakamas' };
}
