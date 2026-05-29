import { useMemo } from 'react';
import { useStore } from '../store';
import { getPageContrast, getProfileContrast } from '../lib/pageContrast';

export function usePageContrast() {
  const theme = useStore((s) => s.theme);
  return useMemo(() => getPageContrast(theme), [theme]);
}

export function useProfileContrast() {
  const theme = useStore((s) => s.theme);
  return useMemo(() => getProfileContrast(theme), [theme]);
}
