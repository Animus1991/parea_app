import { pageTitleForPath } from './pageTitle';

/** Routes that are useful to "continue" after leaving and returning home. */
const BLOCKED = new Set(['/', '/login', '/onboarding']);

/**
 * Persist only paths the user would want to resume — not auth shells or the home itself.
 */
export function isResumeWorthyPath(pathname: string): boolean {
  if (!pathname || BLOCKED.has(pathname)) return false;
  if (pathname.startsWith('/login')) return false;
  return true;
}

export function resumeLabel(pathname: string, language: 'el' | 'en'): string {
  const names = pageTitleForPath(pathname);
  return language === 'el' ? names.el : names.en;
}
