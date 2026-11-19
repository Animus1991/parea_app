import { useHomePendingFeedback } from './useHomePendingFeedback';
import { useHomeVerifyNeeded } from '../components/home/HomeVerifyBanner';

export type HomeHeroGate = 'feedback' | 'verify' | 'welcome' | null;

/** One home message: pending feedback > verify > welcome. */
export function useHomeHeroGate(showWelcome: boolean): HomeHeroGate {
  const pending = useHomePendingFeedback();
  const verifyNeeded = useHomeVerifyNeeded();
  if (pending) return 'feedback';
  if (verifyNeeded) return 'verify';
  if (showWelcome) return 'welcome';
  return null;
}

/** Hide the resume chip while a higher-priority home gate is on screen. */
export function useHomeQuietContinue(): boolean {
  const pending = useHomePendingFeedback();
  const verifyNeeded = useHomeVerifyNeeded();
  return !pending && !verifyNeeded;
}
