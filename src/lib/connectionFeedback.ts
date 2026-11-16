import type { ConnectionRequestOutcome } from '../store';

type T = (el: string, en: string) => string;

/**
 * One plain sentence for every outcome of «Σύνδεση», shared by the
 * Connections page and person profiles so the wording never drifts.
 */
export function connectionOutcomeText(outcome: ConnectionRequestOutcome, name: string, t: T): {
  tone: 'success' | 'info' | 'error';
  text: string;
} {
  switch (outcome) {
    case 'sent':
      return { tone: 'success', text: t(`Στάλθηκε αίτημα σύνδεσης στον/στην ${name}`, `Connection request sent to ${name}`) };
    case 'accepted':
      return {
        tone: 'success',
        text: t(`Ο/Η ${name} σού είχε ήδη στείλει αίτημα — είστε πλέον Nakamas`, `${name} had already asked — you are now Nakamas`),
      };
    case 'exists':
      return { tone: 'info', text: t(`Το αίτημα προς ${name} περιμένει ήδη απάντηση`, `Your request to ${name} is already waiting`) };
    case 'connected':
      return { tone: 'info', text: t(`Είστε ήδη Nakamas με ${name}`, `You are already Nakamas with ${name}`) };
    case 'blocked':
      return { tone: 'error', text: t('Δεν είναι δυνατή η σύνδεση με αυτόν τον χρήστη', 'You cannot connect with this person') };
    default:
      return { tone: 'error', text: t('Το αίτημα δεν στάλθηκε', 'The request was not sent') };
  }
}
