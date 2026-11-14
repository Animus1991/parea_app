import { useEffect } from 'react';
import { isFirebaseConfigured as isFirebaseAuthAvailable } from '../lib/firebaseConfig';
import { useStore } from '../store';
import { createLogger } from '../lib/logger';

const log = createLogger('useFirebaseAuth');

/**
 * Bridges Firebase Auth + Firestore profile → Nakamas user store (CoFounderBay pattern).
 */
export function useFirebaseAuth() {
  const loginWithUser = useStore((s) => s.loginWithUser);
  const logout = useStore((s) => s.logout);
  const demoMode = useStore((s) => s.demoMode);

  useEffect(() => {
    if (!isFirebaseAuthAvailable() || demoMode) return;

    // The Firebase SDK is loaded on demand, only when it is configured.
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import('../services/firebaseAuth'), import('../services/firebaseUserProfile')])
      .then(([{ subscribeFirebaseAuth }, { resolveFirebaseUser }]) => {
        if (cancelled) return;
        unsubscribe = subscribeFirebaseAuth((firebaseUser) => {
          if (!firebaseUser) {
            logout();
            return;
          }

          void resolveFirebaseUser(firebaseUser)
            .then((user) => {
              log.info('firebase profile resolved', { uid: user.id, name: user.name });
              loginWithUser(user);
            })
            .catch((err) => {
              log.error('firebase profile resolve failed', err);
            });
        });
      })
      .catch((err) => log.error('firebase auth module failed to load', err));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [loginWithUser, logout, demoMode]);

  useEffect(() => {
    if (!isFirebaseAuthAvailable()) return;
    const handler = () => {
      if (!demoMode) logout();
    };
    window.addEventListener('nakamas:firebase-signout', handler);
    return () => window.removeEventListener('nakamas:firebase-signout', handler);
  }, [logout, demoMode]);
}
