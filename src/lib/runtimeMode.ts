import { isTicketmasterConfigured } from '../services/eventApi';

/**
 * Client runtime profile for the Nakamas prototype.
 * Backend auth/services are planned in docs/ARCHITECTURE.md; the app ships mock-first.
 */
export const RUNTIME_MODE = {
  /** Seeded user in Zustand + /login mock flow until a real auth service is wired. */
  mockAuth: true,
  /** Ticketmaster ids are prefixed when mapped in eventApi (see mapTmEvent). */
  externalEventIdPrefix: 'tm_' as const,
  isTicketmasterEnabled: isTicketmasterConfigured,
} as const;

export function isExternalApiEvent(eventId: string): boolean {
  return eventId.startsWith(RUNTIME_MODE.externalEventIdPrefix);
}
