/**
 * Firebase Auth — optional layer over mock login (CoFounderBay pattern).
 */
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { createLogger } from '../lib/logger';

const log = createLogger('firebaseAuth');

export function subscribeFirebaseAuth(onUser: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    onUser(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, onUser, (err) => log.error('auth state error', err));
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInAsGuestFirebase(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function isFirebaseAuthAvailable(): boolean {
  return isFirebaseConfigured();
}
