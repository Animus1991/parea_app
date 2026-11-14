/**
 * Server-side identity (audit 2026-11-14, open item "real backend auth").
 *
 * When a Firebase project is configured, every API call and socket may carry
 * a Firebase ID token ("Authorization: Bearer <token>" / socket auth.token).
 * The token is verified here against Google's public keys: RS256 signature,
 * issuer, audience, expiry and subject. Roles come only from custom claims
 * that a trusted backend sets with the Admin SDK, never from the request body.
 *
 * Without a project id the server keeps its previous behaviour (demo mode).
 */
import { readFileSync } from 'node:fs';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JSONWebKeySet, type JWTPayload, type JWTVerifyGetKey } from 'jose';

export type Role = 'member' | 'organizer' | 'moderator' | 'admin';

export interface AuthUser {
  uid: string;
  role: Role;
  email?: string;
  emailVerified: boolean;
  /** Firebase anonymous sign-in (guest). Guests can browse and chat but not publish. */
  anonymous: boolean;
}

export type AuthMode = 'firebase' | 'off';

export interface AuthConfig {
  mode: AuthMode;
  projectId?: string;
  /** Endpoints that need a person (AI, chat) refuse anonymous callers. */
  required: boolean;
}

const PROJECT_ID_PATTERN = /^[a-z0-9-]{4,40}$/;

export function authConfig(env: {
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  AUTH_OPTIONAL?: string;
}): AuthConfig {
  const projectId = (env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '').trim();
  if (!projectId) return { mode: 'off', required: false };
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error('FIREBASE_PROJECT_ID is not a valid Firebase project id');
  }
  return { mode: 'firebase', projectId, required: env.AUTH_OPTIONAL !== 'true' };
}

export const GOOGLE_SECURETOKEN_JWKS =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const ROLE_RANK: Record<Role, number> = { member: 0, organizer: 1, moderator: 2, admin: 3 };

export function hasRole(user: Pick<AuthUser, 'role'> | null | undefined, min: Role): boolean {
  return Boolean(user) && ROLE_RANK[(user as AuthUser).role] >= ROLE_RANK[min];
}

/** Custom claims → role. Unknown values fall back to member. */
export function roleFromClaims(claims: Record<string, unknown>): Role {
  if (claims.admin === true || claims.role === 'admin') return 'admin';
  if (claims.role === 'moderator') return 'moderator';
  if (claims.role === 'organizer' || claims.organizer === true) return 'organizer';
  return 'member';
}

/** Validated payload → user. Applies the Firebase rules jose does not know about. */
export function userFromClaims(payload: JWTPayload, nowSeconds = Date.now() / 1000): AuthUser | null {
  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  if (!uid || uid.length > 128) return null;
  const authTime = (payload as { auth_time?: unknown }).auth_time;
  if (typeof authTime !== 'number' || authTime > nowSeconds + 5) return null;
  if (typeof payload.iat !== 'number' || payload.iat > nowSeconds + 5) return null;
  const claims = payload as Record<string, unknown>;
  const firebase = claims.firebase as { sign_in_provider?: unknown } | undefined;
  return {
    uid,
    role: roleFromClaims(claims),
    email: typeof claims.email === 'string' ? claims.email : undefined,
    emailVerified: claims.email_verified === true,
    anonymous: firebase?.sign_in_provider === 'anonymous',
  };
}

export type TokenVerifier = (token: string) => Promise<AuthUser | null>;

/**
 * Verifies Firebase ID tokens. `keys` is injectable for tests; production uses
 * Google's rotating JWKS (cached by jose and refreshed on unknown key ids).
 */
export function createFirebaseVerifier(
  projectId: string,
  keys: JWTVerifyGetKey = createRemoteJWKSet(new URL(GOOGLE_SECURETOKEN_JWKS)),
): TokenVerifier {
  return async (token: string) => {
    if (!token || token.length > 4096) return null;
    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256'],
        clockTolerance: 5,
      });
      return userFromClaims(payload);
    } catch {
      return null;
    }
  };
}

/**
 * Key source for the verifier. Production always uses Google's JWKS. Outside
 * production, AUTH_TEST_JWKS_FILE may point to a local JWKS so the full HTTP
 * flow can be tested without Google (see docs/SECURITY_HARDENING.md).
 */
export function verifierKeys(env: { NODE_ENV?: string; AUTH_TEST_JWKS_FILE?: string }): JWTVerifyGetKey | undefined {
  if (env.NODE_ENV === 'production' || !env.AUTH_TEST_JWKS_FILE) return undefined;
  const jwks = JSON.parse(readFileSync(env.AUTH_TEST_JWKS_FILE, 'utf8')) as JSONWebKeySet;
  return createLocalJWKSet(jwks);
}

export function bearerToken(header: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? '');
  return match ? match[1] : null;
}

/** Owner of the event, or a moderator/admin. */
export function canEditEvent(user: AuthUser, event: { organizerId?: string } | null | undefined): boolean {
  if (!event) return false;
  return hasRole(user, 'moderator') || event.organizerId === user.uid;
}

/**
 * Applies ownership to an event payload written by a signed-in user:
 * members publish as themselves; only moderators may set another organizer.
 */
export function ownEventPayload<T extends Record<string, unknown>>(user: AuthUser, value: T, isCreate: boolean): T {
  if (hasRole(user, 'moderator')) {
    return isCreate && !value.organizerId ? { ...value, organizerId: user.uid } : value;
  }
  const { organizerId: _ignored, ...rest } = value;
  return (isCreate ? { ...rest, organizerId: user.uid } : rest) as T;
}
