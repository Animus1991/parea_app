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

/** Apply one demo verification flip. Returns false if already done or no user. */
export function verifyDemo(method: VerifyDemoMethod): boolean {
  const s = useStore.getState();
  const user = s.currentUser;
  if (!user) return false;
  if (method === 'email') {
    if (user.emailVerified) return false;
    s.updateUser(user.id, { emailVerified: true });
    return true;
  }
  if (method === 'phone') {
    if (user.phoneVerified) return false;
    s.updateUser(user.id, { phoneVerified: true });
    return true;
  }
  if (user.idVerified) return false;
  s.updateUser(user.id, { idVerified: true });
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
