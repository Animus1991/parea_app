/**
 * Group tickets through a ticketing partner (Φ27, more.com-style). The social
 * side (who is in the group, who has paid) stays in Nakamas; the ticket is the
 * partner's. Only the demo provider is connected today — the others are
 * listed honestly as not connected.
 */
import type { TicketReservation } from '../types/outings';

export interface TicketPartner {
  id: string;
  nameEl: string;
  nameEn: string;
  connected: boolean;
  noteEl: string;
  noteEn: string;
  reserve: (input: { groupId: string; eventId: string; memberIds: string[]; unitPrice: number }) => TicketReservation;
}

export const demoTicketPartner: TicketPartner = {
  id: 'demo',
  nameEl: 'Demo εισιτήρια',
  nameEn: 'Demo tickets',
  connected: true,
  noteEl: 'Λειτουργία επίδειξης: δεν γίνεται πραγματική χρέωση.',
  noteEn: 'Demo mode: nobody is charged.',
  reserve: ({ groupId, memberIds, unitPrice }) => ({
    id: `tr_${groupId}_${Date.now().toString(36)}`,
    provider: 'demo',
    status: 'awaiting_payments',
    unitPrice,
    createdAt: new Date().toISOString(),
    payments: Object.fromEntries(memberIds.map((id) => [id, 'pending' as const])),
  }),
};

/** Shown in settings and docs; not callable until a partnership is signed. */
export const PLANNED_TICKET_PARTNERS = [
  { id: 'more', name: 'more.com', noteEl: 'Συνεργασία υπό συζήτηση', noteEn: 'Partnership under discussion' },
  { id: 'ticketmaster', name: 'Ticketmaster', noteEl: 'Η σύνδεση καταλόγου υπάρχει ήδη· οι αγορές όχι', noteEn: 'Catalogue link exists; purchases do not' },
];

export function activeTicketPartner(): TicketPartner {
  return demoTicketPartner;
}

/** Everyone paid → tickets are issued. */
export function settleReservation(r: TicketReservation): TicketReservation {
  if (r.status !== 'awaiting_payments') return r;
  return Object.values(r.payments).every((p) => p === 'paid') ? { ...r, status: 'issued' } : r;
}
