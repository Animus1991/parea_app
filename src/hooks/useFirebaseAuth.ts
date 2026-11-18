import { useEffect } from 'react';
import { isFirebaseConfigured as isFirebaseAuthAvailable } from '../lib/firebaseConfig';
import { useStore } from '../store';
import { createLogger } from '../lib/logger';
import { setAuthTokenProvider } from '../lib/authToken';

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
            setAuthTokenProvider(null);
            logout();
            return;
          }
          // Every server call now carries a fresh ID token (the SDK refreshes it).
          setAuthTokenProvider(() => firebaseUser.getIdToken(), firebaseUser.uid);

          void Promise.all([resolveFirebaseUser(firebaseUser), firebaseUser.getIdTokenResult().catch(() => null)])
            .then(([user, tokenResult]) => {
              // The server enforces signed custom claims only. The UI also keeps a
              // backend-set Firestore flag (firestore.rules) so existing setups still work.
              const claims = (tokenResult?.claims ?? {}) as Record<string, unknown>;
              const isAdmin =
                user.isAdmin === true || claims.admin === true || claims.role === 'admin' || claims.role === 'moderator';
              const isOrganizer = user.isOrganizer || claims.role === 'organizer' || claims.organizer === true;
              log.info('firebase profile resolved', { uid: user.id, name: user.name });
              loginWithUser({ ...user, isAdmin, isOrganizer });
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
      setAuthTokenProvider(null);
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
