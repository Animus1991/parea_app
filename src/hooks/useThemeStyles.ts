import { useStore } from '../store';
import { getThemeTokens } from '../lib/themes';

export function useThemeStyles() {
  const theme = useStore((s) => s.theme);
  return getThemeTokens(theme);
}
