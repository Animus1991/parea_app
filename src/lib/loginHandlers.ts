import { isFirebaseConfigured as isFirebaseAuthAvailable } from './firebaseConfig';
import {
  isGoogleIdentityConfigured,
  signInWithGoogleIdentity,
  type GoogleIdentityProfile,
} from '../services/googleIdentityAuth';
import { resolveMockUserIdByEmail } from '../data/mockUserEmails';
import { mockUsers } from '../data/mockUsers';
import type { User } from '../types';

export type GoogleSignInResult =
  | { ok: true; via: 'firebase' }
  | { ok: true; via: 'google_identity'; user: User }
  | { ok: false };

function userFromGoogleProfile(profile: GoogleIdentityProfile): User {
  const linkedId = resolveMockUserIdByEmail(profile.email);
  const mockSeed = linkedId ? mockUsers.find((u) => u.id === linkedId) : undefined;
  if (mockSeed) {
    return {
      ...mockSeed,
      name: profile.name?.split(' ')[0] || mockSeed.name,
      photoUrl: profile.picture || mockSeed.photoUrl,
      emailVerified: Boolean(profile.email_verified ?? profile.email),
    };
  }
  return {
    id: `g_${profile.sub}`,
    name: profile.name?.split(' ')[0] || profile.email?.split('@')[0] || 'Member',
    ageRange: '25-34',
    city: 'Athens',
    bio: '',
    interests: ['Social'],
    trustTier: '1_explorer',
    reliabilityScore: 70,
    badges: ['Google member'],
    photoUrl: profile.picture || `https://i.pravatar.cc/200?u=${profile.sub}`,
    emailVerified: Boolean(profile.email_verified ?? profile.email),
    phoneVerified: false,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: false,
    connections: [],
  };
}

/** True when Firebase Auth or Google Identity Client ID is configured. */
export function isProductionGoogleOAuthAvailable(): boolean {
  return isFirebaseAuthAvailable() || isGoogleIdentityConfigured();
}

/**
 * Google login priority:
 * 1) Firebase (full project env)
 * 2) Google Identity Services (VITE_GOOGLE_OAUTH_CLIENT_ID only)
 * 3) false → caller may fall back to demo
 */
export async function tryGoogleSignIn(): Promise<GoogleSignInResult> {
  if (isFirebaseAuthAvailable()) {
    try {
      const { signInWithGoogle } = await import('../services/firebaseAuth');
      await signInWithGoogle();
      return { ok: true, via: 'firebase' };
    } catch {
      // Fall through to GIS if configured.
    }
  }

  if (isGoogleIdentityConfigured()) {
    try {
      const profile = await signInWithGoogleIdentity();
      return { ok: true, via: 'google_identity', user: userFromGoogleProfile(profile) };
    } catch {
      return { ok: false };
    }
  }

  return { ok: false };
}
