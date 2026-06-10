import { useEffect } from 'react';
import { isFirebaseAuthAvailable, subscribeFirebaseAuth } from '../services/firebaseAuth';
import { resolveFirebaseUser } from '../services/firebaseUserProfile';
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

    return subscribeFirebaseAuth((firebaseUser) => {
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
