import { isFirebaseAuthAvailable, signInWithGoogle } from '../services/firebaseAuth';

/** Google login — Firebase when configured, otherwise caller handles mock login. */
export async function tryGoogleSignIn(): Promise<boolean> {
  if (!isFirebaseAuthAvailable()) return false;
  try {
    await signInWithGoogle();
    return true;
  } catch {
    return false;
  }
}
