import { pageTitleForPath } from './pageTitle';

/**
 * Home «Continue» is for unfinished work, not for catalog pages already in
 * the nav. Tags, categories, collections, nearby, saved, settings, etc. are
 * one tap away — reminding you that you visited them is just noise.
 */
const RESUME_PREFIXES = [
  '/events/',
  '/create',
  '/chat/',
  '/night/',
  '/history/feedback/',
] as const;

/**
 * Persist only paths the user would want to resume — a specific event, a
 * join/create flow, a group chat, tonight's outing, or a pending review.
 */
export function isResumeWorthyPath(pathname: string): boolean {
  if (!pathname) return false;
  const path = pathname.split(/[?#]/)[0];
  if (path === '/create') return true;
  return RESUME_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function resumeLabel(pathname: string, language: 'el' | 'en'): string {
  const names = pageTitleForPath(pathname);
  return language === 'el' ? names.el : names.en;
}
