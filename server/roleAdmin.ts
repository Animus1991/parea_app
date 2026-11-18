/**
 * Assigns roles as Firebase custom claims, the only role source that
 * server/auth.ts trusts. No Admin SDK needed: a service-account JWT is
 * exchanged for an OAuth token, then Identity Toolkit `accounts:update`
 * writes `customAttributes`. Used by scripts/set-role.ts.
 */
import { SignJWT, importPKCS8 } from 'jose';
import type { Role } from './auth.ts';

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export const ROLES: readonly Role[] = ['member', 'organizer', 'moderator', 'admin'];
const UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/identitytoolkit', 'https://www.googleapis.com/auth/cloud-platform'];

export function parseServiceAccount(raw: string): ServiceAccount {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Service account file is not valid JSON');
  }
  const sa = data as Partial<ServiceAccount>;
  if (typeof sa.client_email !== 'string' || !sa.client_email.includes('@')) throw new Error('Service account: client_email missing');
  if (typeof sa.private_key !== 'string' || !sa.private_key.includes('PRIVATE KEY')) throw new Error('Service account: private_key missing');
  if (typeof sa.project_id !== 'string' || !/^[a-z0-9-]{4,40}$/.test(sa.project_id)) throw new Error('Service account: project_id missing');
  if (sa.token_uri !== undefined && !/^https:\/\/[a-z0-9.-]+\.googleapis\.com\//.test(sa.token_uri)) {
    throw new Error('Service account: unexpected token_uri');
  }
  return sa as ServiceAccount;
}

/** Signed claims written for each role (they replace any previous custom claims). */
export function claimsForRole(role: Role): Record<string, unknown> {
  switch (role) {
    case 'admin':
      return { role: 'admin', admin: true };
    case 'moderator':
      return { role: 'moderator' };
    case 'organizer':
      return { role: 'organizer' };
    default:
      return {};
  }
}

export async function serviceAccountToken(sa: ServiceAccount, fetchImpl: FetchLike, nowMs = Date.now()): Promise<string> {
  const tokenUri = sa.token_uri ?? DEFAULT_TOKEN_URI;
  const iat = Math.floor(nowMs / 1000);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: SCOPES.join(' ') })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience(tokenUri)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 3600)
    .sign(key);
  const res = await fetchImpl(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const token = (await res.json()) as { access_token?: unknown };
  if (typeof token.access_token !== 'string') throw new Error('Token exchange returned no access_token');
  return token.access_token;
}

export async function setUserRole(opts: {
  serviceAccount: ServiceAccount;
  uid: string;
  role: Role;
  fetchImpl: FetchLike;
  nowMs?: number;
}): Promise<Record<string, unknown>> {
  const { serviceAccount: sa, uid, role, fetchImpl } = opts;
  if (!UID_PATTERN.test(uid)) throw new Error('Invalid uid');
  if (!ROLES.includes(role)) throw new Error(`Unknown role "${role}". Use one of: ${ROLES.join(', ')}`);
  const claims = claimsForRole(role);
  const accessToken = await serviceAccountToken(sa, fetchImpl, opts.nowMs);
  const res = await fetchImpl(
    `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/accounts:update`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
    },
  );
  if (!res.ok) throw new Error(`accounts:update failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return claims;
}
