import type { ThemeId } from './themes';

/**
 * One place for theme picks: store + html[data-theme].
 * The screen itself is the confirmation — no toast overlay.
 */
export function applyThemeSelection(
  id: ThemeId,
  setTheme: (theme: string) => void,
  current?: string,
): void {
  if (current === id) return;
  setTheme(id);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id;
  }
}
