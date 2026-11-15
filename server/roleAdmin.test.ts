// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { exportPKCS8, generateKeyPair, jwtVerify, type CryptoKey } from 'jose';
import { claimsForRole, parseServiceAccount, setUserRole, type ServiceAccount } from './roleAdmin';

let sa: ServiceAccount;
let publicKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  publicKey = pair.publicKey;
  sa = { client_email: 'roles@nakamas-test.iam.gserviceaccount.com', private_key: await exportPKCS8(pair.privateKey), project_id: 'nakamas-test' };
});

type Call = { url: string; init: { method: string; headers: Record<string, string>; body: string } };
function fakeFetch(responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const calls: Call[] = [];
  const impl = async (url: string, init: Call['init']) => {
    calls.push({ url, init });
    const r = responses.shift() ?? { ok: false, status: 500, body: {} };
    return { ok: r.ok, status: r.status, json: async () => r.body, text: async () => JSON.stringify(r.body) };
  };
  return { calls, impl };
}

describe('roleAdmin', () => {
  it('maps roles to the claims server/auth.ts reads', () => {
    expect(claimsForRole('admin')).toEqual({ role: 'admin', admin: true });
    expect(claimsForRole('moderator')).toEqual({ role: 'moderator' });
    expect(claimsForRole('organizer')).toEqual({ role: 'organizer' });
    expect(claimsForRole('member')).toEqual({});
  });

  it('signs a valid service-account assertion and writes the claims', async () => {
    const { calls, impl } = fakeFetch([
      { ok: true, status: 200, body: { access_token: 'ya29.test' } },
      { ok: true, status: 200, body: { localId: 'uid-1' } },
    ]);
    const claims = await setUserRole({ serviceAccount: sa, uid: 'uid-1', role: 'moderator', fetchImpl: impl });
    expect(claims).toEqual({ role: 'moderator' });

    const [tokenCall, updateCall] = calls;
    expect(tokenCall.url).toBe('https://oauth2.googleapis.com/token');
    const form = new URLSearchParams(tokenCall.init.body);
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const { payload } = await jwtVerify(form.get('assertion') as string, publicKey, {
      issuer: sa.client_email,
      audience: 'https://oauth2.googleapis.com/token',
    });
    expect(String(payload.scope)).toContain('identitytoolkit');

    expect(updateCall.url).toBe('https://identitytoolkit.googleapis.com/v1/projects/nakamas-test/accounts:update');
    expect(updateCall.init.headers.Authorization).toBe('Bearer ya29.test');
    expect(JSON.parse(updateCall.init.body)).toEqual({ localId: 'uid-1', customAttributes: '{"role":"moderator"}' });
  });

  it('rejects bad input before calling Google', async () => {
    const { calls, impl } = fakeFetch([]);
    await expect(setUserRole({ serviceAccount: sa, uid: 'bad uid!', role: 'admin', fetchImpl: impl })).rejects.toThrow('Invalid uid');
    await expect(setUserRole({ serviceAccount: sa, uid: 'u1', role: 'root' as never, fetchImpl: impl })).rejects.toThrow('Unknown role');
    expect(calls).toHaveLength(0);
  });

  it('surfaces Google errors', async () => {
    const denied = fakeFetch([{ ok: false, status: 400, body: { error: 'invalid_grant' } }]);
    await expect(setUserRole({ serviceAccount: sa, uid: 'u1', role: 'admin', fetchImpl: denied.impl })).rejects.toThrow('Token exchange failed (400)');
    const notFound = fakeFetch([
      { ok: true, status: 200, body: { access_token: 't' } },
      { ok: false, status: 400, body: { error: { message: 'USER_NOT_FOUND' } } },
    ]);
    await expect(setUserRole({ serviceAccount: sa, uid: 'u1', role: 'admin', fetchImpl: notFound.impl })).rejects.toThrow('USER_NOT_FOUND');
  });

  it('validates service account files', () => {
    expect(() => parseServiceAccount('not json')).toThrow('not valid JSON');
    expect(() => parseServiceAccount(JSON.stringify({ ...sa, client_email: 'x' }))).toThrow('client_email');
    expect(() => parseServiceAccount(JSON.stringify({ ...sa, token_uri: 'https://evil.example/token' }))).toThrow('token_uri');
    expect(parseServiceAccount(JSON.stringify(sa)).project_id).toBe('nakamas-test');
  });
});
