/**
 * Firebase on/off switch without importing the Firebase SDK.
 *
 * The SDK (~440 KB minified) is only downloaded when VITE_FIREBASE_* is set:
 * callers check here first and then `import()` the Firebase modules.
 */
import { appEnv } from './config/env';

export function isFirebaseConfigured(): boolean {
  return Boolean(appEnv.firebase.projectId && appEnv.firebase.apiKey);
}
