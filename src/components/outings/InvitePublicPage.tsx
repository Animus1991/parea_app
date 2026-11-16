import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { coverById } from '../../lib/planCovers';
import { InviteCover } from './InviteCover';
import { cn } from '../../lib/utils';
import type { InviteResponse } from '../../types/outings';

const CHOICES: { id: InviteResponse['status']; el: string; en: string }[] = [
  { id: 'going', el: 'Έρχομαι', en: 'I’m in' },
  { id: 'maybe', el: 'Ίσως', en: 'Maybe' },
  { id: 'no', el: 'Δεν μπορώ', en: 'Can’t make it' },
];

/**
 * Public invitation page (Partiful, adapted) — opens without an account.
 * Shows only what is safe for anyone with the link: the event, the area (not
 * the exact spot), the host's first name and how many are going. Answers are
 * one per name; the names are shown to the person who sent the invite only.
 */
export default function InvitePublicPage() {
  const { inviteId = '' } = useParams();
  const { t, language, setLanguage } = useLanguage();
  const invite = useStore((s) => s.planInvites.find((i) => i.id === inviteId));
  const group = useStore((s) => (invite ? s.groups.find((g) => g.id === invite.groupId) : undefined));
  const event = useStore((s) => (invite ? s.events.find((e) => e.id === invite.eventId) : undefined));
  const host = useStore((s) => (invite ? s.users.find((u) => u.id === invite.hostId) : undefined));
  const signedIn = useStore((s) => Boolean(s.currentUser));
  const respond = useStore((s) => s.respondToPlanInvite);
  const [name, setName] = useState('');
  const [choice, setChoice] = useState<InviteResponse['status']>('going');
  const [done, setDone] = useState<InviteResponse | null>(null);
  const [error, setError] = useState('');

  const shell = (children: ReactNode) => (
    <main id="main-content" className="min-h-screen bg-surface px-4 py-6 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm font-black text-ink">Nakamas</Link>
          <button
            type="button"
            onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
            className="min-h-9 rounded-full border border-border px-3 text-xs font-bold text-ink"
          >
            {language === 'el' ? 'English' : 'Ελληνικά'}
          </button>
        </div>
        {children}
      </div>
    </main>
  );

  if (!invite || !group || !event) {
    return shell(
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <h1 className="text-base font-bold text-ink">{t('Η πρόσκληση δεν βρέθηκε', 'Invitation not found')}</h1>
        <p className="mt-1 text-sm font-medium text-ink-muted">
          {t('Ίσως έληξε ή ο σύνδεσμος είναι λάθος. Ζήτα από τον φίλο σου να τον ξαναστείλει.', 'It may have expired, or the link is wrong. Ask your friend to send it again.')}
        </p>
      </div>,
    );
  }

  const cover = coverById(invite.coverId, event.category);
  const going = invite.responses.filter((r) => r.status === 'going').length;
  const seatsLeft = Math.max(0, group.targetSize - group.members.length);
  const closed = group.status === 'cancelled' || group.status === 'completed' || event.status === 'cancelled';

  return shell(
    <>
      <h1 className="sr-only">{t(`Πρόσκληση: ${event.title}`, `Invitation: ${event.title}`)}</h1>
      <InviteCover cover={cover} event={event} hostFirstName={host?.name.split(' ')[0]} goingCount={group.members.length + going} seatsLeft={seatsLeft} />

      {closed ? (
        <p className="rounded-2xl border border-border bg-surface-raised p-4 text-sm font-bold text-ink">{t('Αυτή η έξοδος δεν δέχεται πια απαντήσεις.', 'This outing no longer takes answers.')}</p>
      ) : done ? (
        <div className="rounded-2xl border border-border bg-surface-raised p-4" role="status">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            {done.status === 'going'
              ? t(`Τέλεια, ${done.name}! Ο/Η ${host?.name.split(' ')[0] ?? 'φίλος σου'} το είδε.`, `Great, ${done.name}! ${host?.name.split(' ')[0] ?? 'Your friend'} can see it.`)
              : t('Η απάντησή σου στάλθηκε.', 'Your answer was sent.')}
          </p>
          {done.status !== 'no' && (
            <p className="mt-2 text-xs font-medium text-ink-muted">
              {seatsLeft > 0
                ? t('Για να κρατήσεις θέση στην ομάδα, φτιάξε λογαριασμό σε ένα λεπτό (email + τηλέφωνο).', 'To hold a seat in the group, sign up in a minute (email + phone).')
                : t('Η ομάδα είναι πλήρης — με λογαριασμό μπαίνεις στη λίστα αναμονής.', 'The group is full — with an account you can join the waitlist.')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={signedIn ? `/events/${event.id}/join?groupId=${group.id}` : '/login'}
              className="inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-xs font-bold text-accent-fg"
            >
              {signedIn ? t('Μπες στην ομάδα', 'Join the group') : t('Δημιουργία λογαριασμού', 'Create an account')}
            </Link>
            <button type="button" onClick={() => setDone(null)} className="min-h-10 rounded-full border border-border px-4 text-xs font-bold text-ink">
              {t('Αλλαγή απάντησης', 'Change answer')}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const r = respond(invite.id, name, choice);
            if (!r) {
              setError(t('Γράψε ένα όνομα με τουλάχιστον 2 γράμματα.', 'Type a name with at least 2 letters.'));
              return;
            }
            setError('');
            setDone(r);
          }}
        >
          <fieldset>
            <legend className="text-sm font-bold text-ink">{t('Θα έρθεις;', 'Are you coming?')}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={choice === c.id}
                  onClick={() => setChoice(c.id)}
                  className={cn(
                    'min-h-11 rounded-xl border px-2 text-xs font-bold',
                    choice === c.id ? 'border-transparent bg-accent text-accent-fg' : 'border-border text-ink hover:border-border-strong',
                  )}
                >
                  {t(c.el, c.en)}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="invite-name" className="text-xs font-bold text-ink">
              {t('Το όνομά σου', 'Your name')}
            </label>
            <input
              id="invite-name"
              value={name}
              maxLength={40}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink"
              aria-describedby="invite-name-help"
            />
            <p id="invite-name-help" className="mt-1 text-2xs font-medium text-ink-muted">
              {t('Το βλέπει μόνο όποιος σε κάλεσε. Δεν χρειάζεται email ούτε κωδικός.', 'Only the person who invited you sees it. No email or password needed.')}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs font-bold text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <button type="submit" className="min-h-11 w-full rounded-full bg-accent px-4 text-sm font-bold text-accent-fg">
            {t('Στείλε απάντηση', 'Send answer')}
          </button>
        </form>
      )}

      <p className="flex items-start gap-1.5 text-2xs font-medium text-ink-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t(
          'Στο Nakamas οι ομάδες είναι μικρές, τα μέλη επιβεβαιώνουν τηλέφωνο και το ακριβές σημείο φαίνεται μόνο στα μέλη.',
          'On Nakamas groups are small, members confirm a phone number and the exact spot is shown to members only.',
        )}
      </p>
    </>,
  );
}
