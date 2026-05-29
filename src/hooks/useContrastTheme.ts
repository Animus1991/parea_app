import { useStore } from '../store';
import { getGlobalContrast } from '../lib/contrastTheme';

export function useContrastTheme() {
  const theme = useStore((s) => s.theme);
  return getGlobalContrast(theme);
}
