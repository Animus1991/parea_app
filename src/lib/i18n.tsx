import React, { createContext, useContext, useState, ReactNode } from 'react';
import enDict from '../../en_dict.json';

type Language = 'el' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const externalTranslations = enDict as Record<string, string>;

// A simple dictionary for our main UI elements. Can be expanded per page.
// We fallback to the Greek text if the english translation isn't available.
const translations: Record<string, Record<Language, string>> = {
  // Navigation / AppShell
  'nav.discover': { el: 'Ανακάλυψη', en: 'Discover' },
  'nav.plans': { el: 'Σχέδια', en: 'Plans' },
  'nav.organize': { el: 'Διοργάνωση', en: 'Organize' },
  'nav.trust': { el: 'Εμπιστοσύνη', en: 'Trust' },
  'nav.profile': { el: 'Προφίλ', en: 'Profile' },
  'nav.my_nakamas': { el: 'Οι Nakamas μου', en: 'My Nakamas' },
  'nav.messages': { el: 'Μηνύματα', en: 'Messages' },
  'nav.wallet': { el: 'Πορτοφόλι & Πληρωμές', en: 'Wallet & Payments' },
  'nav.settings': { el: 'Ρυθμίσεις & Απόρρητο', en: 'Settings & Privacy' },
  'nav.help': { el: 'Κέντρο Βοήθειας', en: 'Help Center' },
  
  // Home Page
  'home.badge.new': { el: 'ΝΕΟΣ ΤΡΟΠΟΣ ΕΞΟΔΟΥ', en: 'NEW WAY TO GO OUT' },
  'home.hero.badge': { el: 'Νέος Τρόπος Εξόδου', en: 'New Way to Go Out' },
  'home.hero.title1': { el: 'Βρείτε παρέα για τις', en: 'Find company for the' },
  'home.hero.title2': { el: 'εμπειρίες', en: 'experiences' },
  'home.hero.title3': { el: 'που ήδη θέλετε να ζήσετε.', en: 'you already want to live.' },
  'home.hero.subtitle': { el: 'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.', en: 'Join small groups for events, activities and nearby getaways — based on shared interests and availability.' },
  
  'home.hero.stat1': { el: 'Μικρες ομαδες', en: 'Small groups' },
  'home.hero.stat2': { el: 'Επαληθευμενη συμμετοχη', en: 'Verified attendance' },
  'home.hero.stat3': { el: 'Δημοσια σημεια', en: 'Public spots' },
  'home.hero.search_placeholder': { el: 'Αναζήτηση εμπειριών...', en: 'Search experiences...' },
  
  // Create Event Button
  'action.create_event': { el: 'Δημιουργία Εμπειρίας', en: 'Create Experience' },
  
  // General
  'general.language': { el: 'EN', en: 'EL' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('el');

  const t = (keyOrGreek: string, englishOrFallback?: string) => {
    const entry = translations[keyOrGreek];
    if (entry) {
      return entry[language];
    }
    // If not found in dictionary, fallback to the inline text in the target language
    if (language === 'en') {
      if (externalTranslations[keyOrGreek]) {
        return externalTranslations[keyOrGreek];
      }
      if (englishOrFallback) {
        return englishOrFallback;
      }
    }
    return keyOrGreek;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
