/**
 * Language context and hook. The provider component lives in LanguageProvider.tsx
 * so this module exports no components (keeps React Fast Refresh working).
 */
import { createContext, useContext } from 'react';
import { toUpperNoAccents } from './greekText';

export type Language = 'el' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (greekText: string, englishText?: string) => string;
  /** Like t(), but returns uppercase text with Greek tonos stripped — for labels styled all-caps. */
  tu: (greekText: string, englishText?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Safe fallback to avoid runtime crashes if a component renders before the provider (e.g., HMR edge cases)
    const t = (greekText: string, englishText?: string) => (englishText ?? greekText);
    const tu = (greekText: string, englishText?: string) => toUpperNoAccents(englishText ?? greekText);
    return { language: 'el', setLanguage: () => {}, t, tu } as const;
  }
  return context;
}
