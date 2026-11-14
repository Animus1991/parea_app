import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'el' | 'en';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

/**
 * Single source of truth for the UI language (Φ23 / Ε2).
 *
 * Previously the language lived in `LanguageProvider` React state, so it was
 * lost on every refresh and could not be changed from outside React (e.g. by
 * the AI copilot). The provider now subscribes to this persisted store and the
 * public `useLanguage()` API is unchanged.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'el',
      setLanguage: (language) => set({ language }),
    }),
    { name: 'nakamas-language' },
  ),
);
