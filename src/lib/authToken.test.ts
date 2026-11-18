import { afterEach, describe, expect, it } from 'vitest';
import { authHeaders, getAuthToken, getAuthUid, setAuthTokenProvider } from './authToken';

afterEach(() => setAuthTokenProvider(null));

describe('authToken', () => {
  it('sends nothing without a signed-in user', async () => {
    expect(await getAuthToken()).toBeNull();
    expect(await authHeaders()).toEqual({});
  });

  it('adds a bearer header from the provider', async () => {
    setAuthTokenProvider(async () => 'id-token');
    expect(await authHeaders()).toEqual({ Authorization: 'Bearer id-token' });
  });

  it('remembers the verified uid only while a provider is set', () => {
    setAuthTokenProvider(async () => 't', 'uid-1');
    expect(getAuthUid()).toBe('uid-1');
    setAuthTokenProvider(null, 'uid-1');
    expect(getAuthUid()).toBeNull();
  });

  it('never throws when the provider fails', async () => {
    setAuthTokenProvider(async () => {
      throw new Error('network');
    });
    expect(await authHeaders()).toEqual({});
  });
});
