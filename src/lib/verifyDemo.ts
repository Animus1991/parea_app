/**
 * Shared demo verification mutations — used by Verification Center buttons and Nakamas AI.
 */
import { useStore } from '../store';

export type VerifyDemoMethod = 'email' | 'phone' | 'id';

export function nextVerifyGap(user: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
} | null | undefined): VerifyDemoMethod | null {
  if (!user) return null;
  if (!user.emailVerified) return 'email';
  if (!user.phoneVerified) return 'phone';
  if (!user.idVerified) return 'id';
  return null;
}

/**
 * Apply one demo verification flip. Returns false if already done or no user.
 * Φ27 — records only the method and the date (`verifiedVia`), never the
 * document or code itself.
 */
export function verifyDemo(method: VerifyDemoMethod): boolean {
  const s = useStore.getState();
  const user = s.currentUser;
  if (!user) return false;
  const today = new Date().toISOString().slice(0, 10);
  const via = (key: 'email' | 'phone' | 'document') => ({ ...(user.verifiedVia ?? {}), [key]: today });
  if (method === 'email') {
    if (user.emailVerified) return false;
    s.updateUser(user.id, { emailVerified: true, verifiedVia: via('email') });
    return true;
  }
  if (method === 'phone') {
    if (user.phoneVerified) return false;
    s.updateUser(user.id, { phoneVerified: true, verifiedVia: via('phone') });
    return true;
  }
  if (user.idVerified) return false;
  s.updateUser(user.id, { idVerified: true, verifiedVia: via('document') });
  return true;
}

export function verifyDemoSnapshot(user: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
}) {
  return {
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    idVerified: !!user.idVerified,
  };
}
