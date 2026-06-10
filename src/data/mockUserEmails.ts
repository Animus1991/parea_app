/**
 * Demo / seed email → mock user id bridge for Firebase Auth (CoFounderBay JIT pattern).
 * Firebase users signing in with these emails inherit mock profile + group membership.
 */
export const MOCK_USER_EMAILS: Record<string, string> = {
  'alex@nakamas.demo': 'u1',
  'maria@nakamas.demo': 'u2',
  'nikos@nakamas.demo': 'u3',
  'elena@nakamas.demo': 'u4',
  'demo@nakamas.gr': 'u1',
  'test@nakamas.gr': 'u2',
};

/** Normalize email for lookup (lowercase, trim). */
export function normalizeDemoEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

export function resolveMockUserIdByEmail(email: string | null | undefined): string | null {
  const key = normalizeDemoEmail(email);
  if (!key) return null;
  return MOCK_USER_EMAILS[key] ?? null;
}
