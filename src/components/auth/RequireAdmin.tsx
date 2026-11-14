import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { isPlatformAdmin } from '../../lib/roles';

/**
 * Route guard for /admin. Typing the URL no longer opens moderation tools
 * for members or organizers. UX guard only: server-side claims are still
 * required for real enforcement (docs/SECURITY_HARDENING.md).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const isAdmin = useStore((s) => isPlatformAdmin(s.currentUser));
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
