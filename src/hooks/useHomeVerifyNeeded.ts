import { useEffect, useState } from 'react';
import { useStore } from '../store';

/** Session dismissal of the Home verify banner, shared by the banner and the hero gate. */
export const DISMISS_KEY = 'nakamas.homeVerifyBanner.dismissed';
export const DISMISS_EVENT = 'nakamas:home-verify-dismissed';

export function homeVerifyIsNeeded(
  user: { emailVerified?: boolean; phoneVerified?: boolean } | null | undefined,
  dismissed: boolean,
): boolean {
  if (!user) return false;
  if (user.emailVerified && user.phoneVerified) return false;
  return !dismissed;
}

export function useHomeVerifyNeeded(): boolean {
  const currentUser = useStore((s) => s.currentUser);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const sync = () => {
      try {
        setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
      } catch {
        setDismissed(false);
      }
    };
    sync();
    window.addEventListener(DISMISS_EVENT, sync);
    return () => window.removeEventListener(DISMISS_EVENT, sync);
  }, []);

  return homeVerifyIsNeeded(currentUser, dismissed);
}
