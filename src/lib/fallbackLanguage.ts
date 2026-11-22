import type { Language } from './i18n';

export function fallbackLanguage(): Language {
  try {
    const stored = JSON.parse(localStorage.getItem('nakamas-language') ?? 'null');
    const language = stored?.state?.language;
    if (language === 'el' || language === 'en') return language;
  } catch {
    // Recovery must work even when storage is unavailable or corrupt.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('el') ? 'el' : 'en';
}
