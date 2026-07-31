/**
 * Google Identity Services (GIS) OAuth — works with only VITE_GOOGLE_OAUTH_CLIENT_ID.
 * Independent of Firebase; use when full Firebase env is not configured.
 */
import { appEnv } from '../lib/config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('googleIdentity');

export interface GoogleIdentityProfile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

export function isGoogleIdentityConfigured(): boolean {
  return Boolean(appEnv.googleOAuthClientId);
}

function decodeJwtPayload(credential: string): GoogleIdentityProfile | null {
  try {
    const [, payload] = credential.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as GoogleIdentityProfile;
  } catch {
    return null;
  }
}

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS script failed')));
      if (window.google?.accounts?.id) resolve();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS script failed'));
    document.head.appendChild(script);
  });
}

/**
 * Opens Google One Tap / prompt and resolves with the ID token profile.
 * Rejects if user dismisses or GIS is unavailable.
 */
export async function signInWithGoogleIdentity(): Promise<GoogleIdentityProfile> {
  const clientId = appEnv.googleOAuthClientId;
  if (!clientId) throw new Error('Google OAuth client id not configured');

  await loadGisScript();
  if (!window.google?.accounts?.id) throw new Error('Google Identity Services unavailable');

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      try {
        window.google?.accounts.id.cancel();
      } catch {
        /* ignore */
      }
      reject(new Error('Google sign-in timed out'));
    }, 120_000);

    window.google!.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        window.clearTimeout(timeout);
        const profile = decodeJwtPayload(response.credential);
        if (!profile?.sub) {
          reject(new Error('Invalid Google credential'));
          return;
        }
        log.info('Google Identity sign-in ok', { sub: profile.sub, email: profile.email });
        resolve(profile);
      },
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        window.clearTimeout(timeout);
        reject(new Error('Google sign-in dismissed'));
      }
    });
  });
}
