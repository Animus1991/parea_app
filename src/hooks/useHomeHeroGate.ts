import { useHomeVerifyNeeded } from './useHomeVerifyNeeded';

export type HomeHeroGate = 'verify' | 'welcome' | null;

/**
 * One home message at a time. A brand-new person first sees the nights picked
 * for them; the verify reminder waits until that welcome is closed, so the
 * first screen gives value before it asks for chores. Rating lives in Notifications.
 */
export function useHomeHeroGate(showWelcome: boolean): HomeHeroGate {
  const verifyNeeded = useHomeVerifyNeeded();
  if (showWelcome) return 'welcome';
  if (verifyNeeded) return 'verify';
  return null;
}

/** Hide the resume chip while a higher-priority home gate is on screen. */
export function useHomeQuietContinue(): boolean {
  const verifyNeeded = useHomeVerifyNeeded();
  return !verifyNeeded;
}
