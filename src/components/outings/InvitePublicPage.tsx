import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { coverById } from '../../lib/planCovers';
import { InviteCover } from './InviteCover';
import { cn } from '../../lib/utils';
import type { InviteResponse } from '../../types/outings';
import { fetchPublicInvite, sendInviteResponse, type PublicInviteDto } from '../../services/invitesApi';

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
  const localInvite = useStore((s) => s.planInvites.find((i) => i.id === inviteId));
  const localGroup = useStore((s) => (localInvite ? s.groups.find((g) => g.id === localInvite.groupId) : undefined));
  const localEvent = useStore((s) => (localInvite ? s.events.find((e) => e.id === localInvite.eventId) : undefined));
  const localHost = useStore((s) => (localInvite ? s.users.find((u) => u.id === localInvite.hostId) : undefined));
  const knownEventIds = useStore((s) => s.events.map((e) => e.id).join(','));
  const signedIn = useStore((s) => Boolean(s.currentUser));
  const respond = useStore((s) => s.respondToPlanInvite);
  const [name, setName] = useState('');
  const [choice, setChoice] = useState<InviteResponse['status']>('going');
  const [done, setDone] = useState<Pick<InviteResponse, 'name' | 'status'> | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  // Φ28 — the invite as the server knows it (undefined = still asking; null = not there / no server).
  const [remote, setRemote] = useState<PublicInviteDto | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void fetchPublicInvite(inviteId).then((r) => {
      if (alive) setRemote(r);
    });
    return () => {
      alive = false;
    };
  }, [inviteId]);

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

  const hasLocal = Boolean(localInvite && localGroup && localEvent);
  if (!hasLocal && remote === undefined) {
    return shell(
      <p role="status" className="rounded-2xl border border-border bg-surface-raised p-5 text-sm font-bold text-ink">
        {t('Ανοίγει η πρόσκληση…', 'Opening the invitation…')}
      </p>,
    );
  }

  if (!hasLocal && !remote) {
    return shell(
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <h1 className="text-lg md:text-xl font-bold tracking-tight leading-tight text-ink">{t('Η πρόσκληση δεν βρέθηκε', 'Invitation not found')}</h1>
        <p className="mt-1 text-sm font-medium text-ink-muted">
          {t('Ίσως έληξε ή ο σύνδεσμος είναι λάθος. Ζήτα από τον φίλο σου να τον ξαναστείλει.', 'It may have expired, or the link is wrong. Ask your friend to send it again.')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={signedIn ? '/plans' : '/'}
            className="inline-flex min-h-8 items-center rounded-full bg-accent px-4 text-xs font-bold text-accent-fg"
          >
            {signedIn ? t('Τα σχέδιά μου', 'My plans') : t('Άνοιγμα Nakamas', 'Open Nakamas')}
          </Link>
          {!signedIn && (
            <Link to="/login" className="inline-flex min-h-8 items-center rounded-full border border-border px-4 text-xs font-bold text-ink">
              {t('Σύνδεση', 'Sign in')}
            </Link>
          )}
        </div>
      </div>,
    );
  }

  // One view for both sources: this device's copy when it has one (always fresher), else the server's card.
  const view = hasLocal
    ? {
        eventId: localEvent!.id,
        groupId: localGroup!.id as string | null,
        title: localEvent!.title,
        date: localEvent!.date,
        time: localEvent!.time,
        area: localEvent!.locationArea,
        category: localEvent!.category,
        coverId: localInvite!.coverId,
        hostFirstName: localHost?.name.split(' ')[0],
        members: localGroup!.members.length,
        targetSize: localGroup!.targetSize,
        closed: localGroup!.status === 'cancelled' || localGroup!.status === 'completed' || localEvent!.status === 'cancelled',
        going: Math.max(localInvite!.responses.filter((r) => r.status === 'going').length, remote?.going ?? 0),
      }
    : {
        eventId: remote!.card.eventId,
        groupId: null as string | null,
        title: remote!.card.eventTitle,
        date: remote!.card.date,
        time: remote!.card.time,
        area: remote!.card.area,
        category: remote!.card.category,
        coverId: remote!.card.coverId,
        hostFirstName: remote!.card.hostFirstName || undefined,
        members: remote!.card.members,
        targetSize: remote!.card.targetSize,
        closed: remote!.card.closed,
        going: remote!.going,
      };
  const cover = coverById(view.coverId, view.category);
  const seatsLeft = Math.max(0, view.targetSize - view.members);
  const closed = view.closed;
  const coverEvent = { title: view.title, date: view.date, time: view.time, locationArea: view.area };
  const eventKnownHere = knownEventIds.split(',').includes(view.eventId);
  const joinPath = !signedIn
    ? '/login'
    : view.groupId
      ? `/events/${view.eventId}/join?groupId=${view.groupId}`
      : eventKnownHere
        ? `/events/${view.eventId}`
        : '/';

  const submit = async () => {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 2) {
      setError(t('Γράψε ένα όνομα με τουλάχιστον 2 γράμματα.', 'Type a name with at least 2 letters.'));
      return;
    }
    setSending(true);
    let ok = false;
    if (remote) {
      const r = await sendInviteResponse(inviteId, clean, choice);
      if (r === 'closed') {
        setSending(false);
        setError(t('Αυτή η έξοδος δεν δέχεται πια απαντήσεις.', 'This outing no longer takes answers.'));
        return;
      }
      ok = r === 'ok';
    }
    // On the inviting device the answer also lands straight in its own list.
    if (localInvite && respond(localInvite.id, clean, choice)) ok = true;
    setSending(false);
    if (!ok) {
      setError(t('Η απάντηση δεν στάλθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.', 'Your answer was not sent. Check your connection and try again.'));
      return;
    }
    setError('');
    setDone({ name: clean, status: choice });
  };

  return shell(
    <>
      <h1 className="sr-only">{t(`Πρόσκληση: ${view.title}`, `Invitation: ${view.title}`)}</h1>
      <InviteCover cover={cover} event={coverEvent} hostFirstName={view.hostFirstName} goingCount={view.members + view.going} seatsLeft={seatsLeft} />

      {closed ? (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4">
          <p className="text-sm font-bold text-ink">{t('Αυτή η έξοδος δεν δέχεται πια απαντήσεις.', 'This outing no longer takes answers.')}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={signedIn ? '/plans' : '/'}
              className="inline-flex min-h-8 items-center rounded-full bg-accent px-4 text-xs font-bold text-accent-fg"
            >
              {signedIn ? t('Τα σχέδιά μου', 'My plans') : t('Άνοιγμα Nakamas', 'Open Nakamas')}
            </Link>
            <Link to="/buddy-seek" className="inline-flex min-h-8 items-center rounded-full border border-border px-4 text-xs font-bold text-ink">
              {t('Βρες Nakamas', 'Find Nakamas')}
            </Link>
          </div>
        </div>
      ) : done ? (
        <div className="rounded-2xl border border-border bg-surface-raised p-4" role="status">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            {done.status === 'going'
              ? t(`Τέλεια, ${done.name}! Ο/Η ${view.hostFirstName ?? 'φίλος σου'} θα το δει.`, `Great, ${done.name}! ${view.hostFirstName ?? 'Your friend'} will see it.`)
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
              to={joinPath}
              className="inline-flex min-h-8 items-center rounded-full bg-accent px-4 text-xs font-bold text-accent-fg"
            >
              {signedIn ? t('Μπες στην ομάδα', 'Join the group') : t('Δημιουργία λογαριασμού', 'Create an account')}
            </Link>
            <button type="button" onClick={() => setDone(null)} className="min-h-8 rounded-full border border-border px-4 text-xs font-bold text-ink">
              {t('Αλλαγή απάντησης', 'Change answer')}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
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
                    'min-h-8 rounded-xl border px-2 text-xs font-bold',
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
              className="mt-1 min-h-8 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink"
              aria-describedby="invite-name-help"
            />
            <p id="invite-name-help" className="mt-1 text-xs font-medium text-ink-muted">
              {t('Το βλέπει μόνο όποιος σε κάλεσε. Δεν χρειάζεται email ούτε κωδικός.', 'Only the person who invited you sees it. No email or password needed.')}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs font-bold text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={sending} className="min-h-9 w-full rounded-full bg-accent px-4 text-xs font-bold text-accent-fg disabled:opacity-60">
            {sending ? t('Στέλνεται…', 'Sending…') : t('Στείλε απάντηση', 'Send answer')}
          </button>
        </form>
      )}

      <p className="flex items-start gap-1.5 text-xs font-medium text-ink-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t(
          'Στο Nakamas οι ομάδες είναι μικρές, τα μέλη επιβεβαιώνουν τηλέφωνο και το ακριβές σημείο φαίνεται μόνο στα μέλη.',
          'On Nakamas groups are small, members confirm a phone number and the exact spot is shown to members only.',
        )}
      </p>
    </>,
  );
}
