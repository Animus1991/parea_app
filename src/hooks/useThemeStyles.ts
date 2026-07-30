import { useStore } from '../store';
import { getThemeTokens } from '../lib/designTokens';

export function useThemeStyles() {
  const theme = useStore((s) => s.theme);
  return getThemeTokens(theme);
}
