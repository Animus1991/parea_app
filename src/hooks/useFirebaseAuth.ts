import { useEffect } from 'react';
import { isFirebaseAuthAvailable, subscribeFirebaseAuth } from '../services/firebaseAuth';
import { useStore } from '../store';
import { createLogger } from '../lib/logger';

const log = createLogger('useFirebaseAuth');

/**
 * Bridges Firebase Auth → mock user store when VITE_FIREBASE_* is configured.
 * Maps Firebase uid to local user u1 for prototype parity.
 */
export function useFirebaseAuth() {
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const demoMode = useStore((s) => s.demoMode);

  useEffect(() => {
    if (!isFirebaseAuthAvailable() || demoMode) return;

    return subscribeFirebaseAuth((firebaseUser) => {
      if (firebaseUser) {
        log.info('firebase user signed in', { uid: firebaseUser.uid });
        login('u1');
      }
    });
  }, [login, demoMode]);

  useEffect(() => {
    if (!isFirebaseAuthAvailable()) return;
    const handler = () => {
      if (!demoMode) logout();
    };
    window.addEventListener('nakamas:firebase-signout', handler);
    return () => window.removeEventListener('nakamas:firebase-signout', handler);
  }, [logout, demoMode]);
}
