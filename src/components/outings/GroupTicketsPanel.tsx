import { CreditCard, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { activeTicketPartner, PLANNED_TICKET_PARTNERS } from '../../services/ticketPartner';
import { Button } from '../common/Button';
import type { Event, Group, User } from '../../types';

/**
 * Group tickets through a ticketing partner (more.com-style, adapted): the
 * host holds seats for everyone, each member pays their own share, tickets
 * are issued once all have paid. Today only the demo provider is connected.
 */
export function GroupTicketsPanel({ group, event, members, isHost }: { group: Group; event: Event; members: User[]; isHost: boolean }) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const reserve = useStore((s) => s.reserveGroupTickets);
  const pay = useStore((s) => s.payTicketShare);
  const cancel = useStore((s) => s.cancelGroupTickets);
  if (!event.isPaid) return null;
  const partner = activeTicketPartner();
  const r = group.tickets && group.tickets.status !== 'cancelled' ? group.tickets : null;
  const paidCount = r ? Object.values(r.payments).filter((p) => p === 'paid').length : 0;
  const myShare = r && me ? r.payments[me.id] : undefined;
  const pct = group.discountUnlocked && event.groupDiscount ? event.groupDiscount.percentage : 0;
  const unit = r?.unitPrice ?? Math.round(event.price * (1 - pct / 100) * 100) / 100;

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="tickets-title">
      <h3 id="tickets-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <Ticket className="h-4 w-4" aria-hidden /> {t('Εισιτήρια ομάδας', 'Group tickets')}
      </h3>
      <p className="mt-1 text-xs font-medium text-ink-muted">
        {t(`${unit.toFixed(2)} € το άτομο${pct ? ` (με −${pct}% ομαδική έκπτωση)` : ''}. Ο καθένας πληρώνει μόνο το δικό του.`, `€${unit.toFixed(2)} per person${pct ? ` (with −${pct}% group discount)` : ''}. Everyone pays only their own share.`)}
      </p>

      {r ? (
        <>
          <p className="mt-3 text-sm font-bold text-ink" role="status">
            {r.status === 'issued'
              ? t('Τα εισιτήρια εκδόθηκαν για όλη την ομάδα.', 'Tickets were issued for the whole group.')
              : t(`Πλήρωσαν ${paidCount} από ${Object.keys(r.payments).length}`, `${paidCount} of ${Object.keys(r.payments).length} have paid`)}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {members.map((m) => (
              <li key={m.id} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-ink">
                {m.name.split(' ')[0]} · {r.payments[m.id] === 'paid' ? t('πλήρωσε', 'paid') : t('εκκρεμεί', 'pending')}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {myShare === 'pending' && r.status === 'awaiting_payments' && (
              <Button
                size="sm"
                onClick={() => {
                  pay(group.id);
                  toast.success(t('Το μερίδιό σου πληρώθηκε.', 'Your share was paid.'));
                }}
              >
                <CreditCard className="mr-1.5 h-4 w-4" aria-hidden /> {t(`Πλήρωσε το μερίδιό σου (${unit.toFixed(2)} €)`, `Pay your share (€${unit.toFixed(2)})`)}
              </Button>
            )}
            {isHost && r.status === 'awaiting_payments' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  cancel(group.id);
                  toast.message(t('Η κράτηση ακυρώθηκε.', 'The hold was cancelled.'), {
                    action: {
                      label: t('Ξανά κράτηση', 'Hold again'),
                      onClick: () => {
                        if (reserve(group.id)) toast.success(t('Κρατήθηκαν θέσεις για την ομάδα.', 'Seats held for the group.'));
                      },
                    },
                  });
                }}
              >
                <X className="mr-1.5 h-4 w-4" aria-hidden /> {t('Ακύρωση κράτησης', 'Cancel hold')}
              </Button>
            )}
          </div>
        </>
      ) : isHost ? (
        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => {
              if (reserve(group.id)) toast.success(t('Κρατήθηκαν θέσεις για την ομάδα.', 'Seats held for the group.'));
              else toast.error(t('Δεν έγινε η κράτηση.', 'Could not hold seats.'));
            }}
          >
            <Ticket className="mr-1.5 h-4 w-4" aria-hidden /> {t(`Κράτησε ${group.members.length} θέσεις μαζί`, `Hold ${group.members.length} seats together`)}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-ink-muted">{t('Ο/Η οικοδεσπότης μπορεί να κρατήσει θέσεις για όλους μαζί.', 'The host can hold seats for everyone together.')}</p>
      )}

      <p className="mt-3 text-2xs font-medium text-ink-muted">
        {t(partner.noteEl, partner.noteEn)}{' '}
        {PLANNED_TICKET_PARTNERS.map((p) => `${p.name}: ${t(p.noteEl, p.noteEn).toLowerCase()}`).join(' · ')}.
      </p>
    </section>
  );
}
