import { useStore } from '../store';
import { getHomeContrastTheme } from '../lib/designTokens';

export function useHomeTheme() {
  const theme = useStore((s) => s.theme);
  return getHomeContrastTheme(theme);
}
