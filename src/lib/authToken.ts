/**
 * The signed-in user's ID token for server calls (server/auth.ts verifies it).
 * Firebase registers a provider after sign-in; demo mode has none, so calls
 * go out without an Authorization header, exactly as before.
 */
type TokenProvider = () => Promise<string | null>;

let provider: TokenProvider | null = null;
let uid: string | null = null;

/** `nextUid` is the verified account id the server will attribute messages to. */
export function setAuthTokenProvider(next: TokenProvider | null, nextUid: string | null = null): void {
  provider = next;
  uid = next ? nextUid : null;
}

/** Firebase uid of the signed-in user, or null in demo mode. */
export function getAuthUid(): string | null {
  return uid;
}

export async function getAuthToken(): Promise<string | null> {
  if (!provider) return null;
  try {
    return await provider();
  } catch {
    return null;
  }
}

/** `{ Authorization: 'Bearer …' }` when signed in, `{}` otherwise. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
