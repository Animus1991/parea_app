import { toast } from 'sonner';
import { THEME_LABELS, type ThemeId } from './themes';

/**
 * One place for theme picks: store + html[data-theme] + short confirmation toast.
 * Callers that already know the theme has not changed can skip the toast by
 * passing `current` equal to `id`.
 */
export function applyThemeSelection(
  id: ThemeId,
  setTheme: (theme: string) => void,
  language: 'el' | 'en',
  current?: string,
): void {
  if (current === id) return;
  setTheme(id);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id;
  }
  toast.message(
    language === 'el'
      ? `Θέμα: ${THEME_LABELS[id].el}`
      : `Theme: ${THEME_LABELS[id].en}`,
  );
}
