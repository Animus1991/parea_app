import { useStore } from '../store';
import { getGlobalContrast } from '../lib/designTokens';

export function useContrastTheme() {
  const theme = useStore((s) => s.theme);
  return getGlobalContrast(theme);
}
