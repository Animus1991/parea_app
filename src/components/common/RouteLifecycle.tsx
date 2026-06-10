import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPage } from '../../lib/analytics';
import { useLanguage } from '../../lib/i18n';

const APP_NAME = 'Nakamas';

const ROUTE_TITLES: Record<string, [string, string]> = {
  '/': ['Αρχική', 'Home'],
  '/login': ['Σύνδεση', 'Sign in'],
  '/onboarding': ['Onboarding', 'Onboarding'],
  '/categories': ['Κατηγορίες', 'Categories'],
  '/nearby': ['Κοντά μου', 'Nearby'],
  '/agenda': ['Ημερολόγιο', 'My Calendar'],
  '/plans': ['Πλάνα', 'Plans'],
  '/buddy-seek': ['Buddy Seek', 'Buddy Seek'],
  '/history': ['Ιστορικό', 'History'],
  '/saved': ['Αποθηκευμένα', 'Saved'],
  '/connections': ['Συνδέσεις', 'Connections'],
  '/chats': ['Μηνύματα', 'Messages'],
  '/manage': ['Οργανωτής', 'Organizer'],
  '/create': ['Δημιουργία', 'Create event'],
  '/wallet': ['Πορτοφόλι', 'Wallet'],
  '/verification': ['Επαλήθευση', 'Verification'],
  '/trust': ['Εμπιστοσύνη', 'Trust'],
  '/report': ['Αναφορά', 'Report'],
  '/profile': ['Προφίλ', 'Profile'],
  '/notifications': ['Ειδοποιήσεις', 'Notifications'],
  '/settings': ['Ρυθμίσεις', 'Settings'],
  '/help': ['Βοήθεια', 'Help'],
  '/admin': ['Admin', 'Admin'],
  '/achievements': ['Επιτεύγματα', 'Achievements'],
  '/leaderboard': ['Κατάταξη', 'Leaderboard'],
  '/challenges': ['Προκλήσεις', 'Challenges'],
};

export function titleForPath(pathname: string, lang: 'el' | 'en'): string {
  const exact = ROUTE_TITLES[pathname];
  if (exact) return lang === 'el' ? exact[0] : exact[1];
  if (pathname.startsWith('/events/')) return lang === 'el' ? 'Εκδήλωση' : 'Event';
  if (pathname.startsWith('/chat/')) return lang === 'el' ? 'Συνομιλία ομάδας' : 'Group chat';
  if (pathname.startsWith('/organizer/')) return lang === 'el' ? 'Οργανωτής' : 'Organizer';
  return lang === 'el' ? 'Σελίδα' : 'Page';
}

export function RouteLifecycle() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const pageTitle = titleForPath(pathname, language);
    document.title =
      pathname === '/'
        ? `${APP_NAME} — ${pageTitle}`
        : `${pageTitle} · ${APP_NAME}`;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    trackPage(pathname, { title: pageTitle });
    setAnnouncement(pageTitle);
  }, [pathname, language]);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );
}
