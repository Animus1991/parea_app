import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { isOrganizerUser } from '../../lib/roles';

/**
 * Route guard for /manage. UX guard only — server claims still required for
 * real enforcement (docs/SECURITY_HARDENING.md). Platform admins may enter too.
 */
export function RequireOrganizer({ children }: { children: ReactNode }) {
  const allowed = useStore((s) => isOrganizerUser(s.currentUser));
  if (!allowed) return <Navigate to="/create" replace />;
  return <>{children}</>;
}
