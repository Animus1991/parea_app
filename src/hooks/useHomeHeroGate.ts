import { useHomeVerifyNeeded } from '../components/home/HomeVerifyBanner';

export type HomeHeroGate = 'verify' | 'welcome' | null;

/** One home message: verify, then welcome. Rating lives in Notifications. */
export function useHomeHeroGate(showWelcome: boolean): HomeHeroGate {
  const verifyNeeded = useHomeVerifyNeeded();
  if (verifyNeeded) return 'verify';
  if (showWelcome) return 'welcome';
  return null;
}

/** Hide the resume chip while a higher-priority home gate is on screen. */
export function useHomeQuietContinue(): boolean {
  const verifyNeeded = useHomeVerifyNeeded();
  return !verifyNeeded;
}
