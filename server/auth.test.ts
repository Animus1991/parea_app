import { describe, expect, it, beforeAll } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet, type JWTVerifyGetKey, type CryptoKey } from 'jose';
import {
  authConfig,
  bearerToken,
  canEditEvent,
  createFirebaseVerifier,
  hasRole,
  ownEventPayload,
  roleFromClaims,
  type AuthUser,
} from './auth';

const PROJECT = 'nakamas-test';
let privateKey: CryptoKey;
let otherKey: CryptoKey;
let keys: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  otherKey = (await generateKeyPair('RS256')).privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  keys = createLocalJWKSet({ keys: [jwk] });
});

async function token(
  claims: Record<string, unknown> = {},
  opts: { key?: CryptoKey; iss?: string; aud?: string; exp?: string | number; sub?: string; alg?: string } = {},
) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ auth_time: now - 60, firebase: { sign_in_provider: 'google.com' }, ...claims })
    .setProtectedHeader({ alg: opts.alg ?? 'RS256', kid: 'k1' })
    .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(opts.aud ?? PROJECT)
    .setSubject(opts.sub ?? 'user-123')
    .setIssuedAt(now - 30)
    .setExpirationTime(opts.exp ?? '1h')
    .sign(opts.key ?? privateKey);
}

describe('authConfig', () => {
  it('is off without a project id', () => {
    expect(authConfig({})).toEqual({ mode: 'off', required: false });
  });
  it('uses the server or the Vite project id', () => {
    expect(authConfig({ FIREBASE_PROJECT_ID: PROJECT })).toMatchObject({ mode: 'firebase', projectId: PROJECT, required: true });
    expect(authConfig({ VITE_FIREBASE_PROJECT_ID: PROJECT, AUTH_OPTIONAL: 'true' })).toMatchObject({ required: false });
  });
  it('rejects a malformed project id', () => {
    expect(() => authConfig({ FIREBASE_PROJECT_ID: 'Bad Project/../' })).toThrow();
  });
});

describe('createFirebaseVerifier', () => {
  it('accepts a valid token and maps claims', async () => {
    const verify = createFirebaseVerifier(PROJECT, keys);
    const user = await verify(await token({ email: 'a@b.gr', email_verified: true, role: 'organizer' }));
    expect(user).toEqual({ uid: 'user-123', role: 'organizer', email: 'a@b.gr', emailVerified: true, anonymous: false });
  });

  it('marks anonymous sign-in as a guest', async () => {
    const verify = createFirebaseVerifier(PROJECT, keys);
    const user = await verify(await token({ firebase: { sign_in_provider: 'anonymous' } }));
    expect(user?.anonymous).toBe(true);
  });

  it('rejects wrong audience, wrong issuer, expiry and foreign signatures', async () => {
    const verify = createFirebaseVerifier(PROJECT, keys);
    expect(await verify(await token({}, { aud: 'another-project' }))).toBeNull();
    expect(await verify(await token({}, { iss: 'https://evil.example/nakamas-test' }))).toBeNull();
    expect(await verify(await token({}, { exp: Math.floor(Date.now() / 1000) - 120 }))).toBeNull();
    expect(await verify(await token({}, { key: otherKey }))).toBeNull();
  });

  it('rejects a token whose auth_time is in the future, an empty subject and garbage', async () => {
    const verify = createFirebaseVerifier(PROJECT, keys);
    expect(await verify(await token({ auth_time: Math.floor(Date.now() / 1000) + 3600 }))).toBeNull();
    expect(await verify(await token({}, { sub: '' }))).toBeNull();
    expect(await verify('not-a-jwt')).toBeNull();
    expect(await verify('')).toBeNull();
  });

  it('ignores a role sent anywhere but a signed claim', async () => {
    const verify = createFirebaseVerifier(PROJECT, keys);
    const user = await verify(await token({ role: 'superuser' }));
    expect(user?.role).toBe('member');
  });
});

describe('roles and ownership', () => {
  const member: AuthUser = { uid: 'u1', role: 'member', emailVerified: true, anonymous: false };
  const mod: AuthUser = { uid: 'm1', role: 'moderator', emailVerified: true, anonymous: false };

  it('ranks roles', () => {
    expect(roleFromClaims({ admin: true })).toBe('admin');
    expect(hasRole(mod, 'organizer')).toBe(true);
    expect(hasRole(member, 'organizer')).toBe(false);
    expect(hasRole(null, 'member')).toBe(false);
  });

  it('lets owners and moderators edit, nobody else', () => {
    expect(canEditEvent(member, { organizerId: 'u1' })).toBe(true);
    expect(canEditEvent(member, { organizerId: 'u2' })).toBe(false);
    expect(canEditEvent(mod, { organizerId: 'u2' })).toBe(true);
    expect(canEditEvent(member, null)).toBe(false);
  });

  it('members always publish as themselves', () => {
    expect(ownEventPayload(member, { title: 'x', organizerId: 'someone-else' }, true)).toEqual({ title: 'x', organizerId: 'u1' });
    expect(ownEventPayload(member, { title: 'x', organizerId: 'someone-else' }, false)).toEqual({ title: 'x' });
    expect(ownEventPayload(mod, { title: 'x', organizerId: 'org9' }, true)).toEqual({ title: 'x', organizerId: 'org9' });
    expect(ownEventPayload(mod, { title: 'x' }, true)).toEqual({ title: 'x', organizerId: 'm1' });
  });

  it('parses bearer headers strictly', () => {
    expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(bearerToken('bearer abc')).toBe('abc');
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken('Bearer a b')).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
  });
});
