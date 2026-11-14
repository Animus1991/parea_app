import type { User } from '../types';

/**
 * Role checks in one place (audit 2026-11-14, §4 Critical).
 *
 * - Platform admin (moderation, /admin, admin-only AI tools) comes only from
 *   trusted seed data: `isAdmin` is re-applied from the seeds on every load
 *   and is never set by any client action.
 * - Organizer (`isOrganizer`) is a normal member capability: hosting a group
 *   turns it on, and it grants nothing outside the user's own events.
 *
 * In this SPA these are UX guards; real enforcement needs server-verified
 * claims (see docs/SECURITY_HARDENING.md).
 */
export function isPlatformAdmin(user: Pick<User, 'isAdmin'> | null | undefined): boolean {
  return Boolean(user?.isAdmin);
}

/** Host of the group, organizer of its event, or a platform admin. */
export function canModerateGroup(
  user: Pick<User, 'id' | 'isAdmin'> | null | undefined,
  group: { hostId?: string } | null | undefined,
  event: { organizerId?: string } | null | undefined,
): boolean {
  if (!user) return false;
  return user.id === group?.hostId || user.id === event?.organizerId || isPlatformAdmin(user);
}
