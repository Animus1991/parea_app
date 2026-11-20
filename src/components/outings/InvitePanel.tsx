import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { coverById, coversFor } from '../../lib/planCovers';
import { Button } from '../common/Button';
import { InviteCover } from './InviteCover';
import { cn } from '../../lib/utils';
import type { Event, Group } from '../../types';

/**
 * «Κάλεσε φίλους» (Partiful, adapted): a link friends can answer without an
 * account. The cover is one of 4 gentle themes for this kind of outing. The
 * names friends type are shown only to the person who sent the invite.
 */
export function InvitePanel({ group, event }: { group: Group; event: Event }) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const invites = useStore((s) => s.planInvites);
  const createPlanInvite = useStore((s) => s.createPlanInvite);
  const setPlanInviteCover = useStore((s) => s.setPlanInviteCover);
  const syncPlanInvite = useStore((s) => s.syncPlanInvite);
  const pullInviteResponses = useStore((s) => s.pullInviteResponses);
  const [copied, setCopied] = useState(false);
  const invite = invites.find((i) => i.groupId === group.id && i.hostId === me?.id);
  const covers = coversFor(event.category);
  const [pendingCover, setPendingCover] = useState(covers[0].id);
  const [coverOpen, setCoverOpen] = useState(false);
  const cover = coverById(invite?.coverId ?? pendingCover, event.category);
  const link = invite ? `${window.location.origin}/i/${invite.id}` : '';
  const seatsLeft = Math.max(0, group.targetSize - group.members.length);
  const host = users.find((u) => u.id === (invite?.hostId ?? me?.id));

  const pick = (id: string) => (invite ? setPlanInviteCover(invite.id, id) : setPendingCover(id));
  const copy = async (url = link) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('Ο σύνδεσμος αντιγράφηκε', 'Link copied'));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      toast.error(t('Δεν έγινε αντιγραφή — δοκίμασε ξανά', 'Copy failed — try again'));
    }
  };

  const createInvite = () => {
    const id = createPlanInvite(group.id, pendingCover);
    if (!id) {
      toast.error(t('Δεν έγινε ο σύνδεσμος', 'Could not create the link'));
      return;
    }
    const url = `${window.location.origin}/i/${id}`;
    toast.success(t('Έτοιμος ο σύνδεσμος πρόσκλησης', 'Invite link ready'), {
      action: {
        label: t('Αντιγραφή', 'Copy'),
        onClick: () => {
          void copy(url);
        },
      },
    });
  };
  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) await nav.share({ title: event.title, text: t('Έλα μαζί μας!', 'Come with us!'), url: link }).catch(() => undefined);
    else void copy();
  };

  // Φ28 — keep the server's copy of the card current (cover, seats) and bring in
  // answers given on other devices while this screen is open.
  const inviteId = invite?.id;
  const cardKey = `${invite?.coverId}|${group.members.length}|${group.targetSize}|${group.status}`;
  useEffect(() => {
    if (!inviteId) return;
    let alive = true;
    const pull = () => {
      if (alive && document.visibilityState === 'visible') void pullInviteResponses(inviteId);
    };
    void syncPlanInvite(inviteId).then((ok) => {
      if (ok) pull();
    });
    const timer = window.setInterval(pull, 20_000);
    document.addEventListener('visibilitychange', pull);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', pull);
    };
  }, [inviteId, cardKey, syncPlanInvite, pullInviteResponses]);

  const responses = invite?.responses ?? [];
  const going = responses.filter((r) => r.status === 'going');
  const maybe = responses.filter((r) => r.status === 'maybe');

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="invite-title">
      <h3 id="invite-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <Link2 className="h-4 w-4" aria-hidden /> {t('Κάλεσε φίλους', 'Invite friends')}
      </h3>
      <p className="mt-1 text-xs font-medium text-ink-muted">
        {t('Απαντούν με ένα πάτημα, χωρίς λογαριασμό. Για να κρατήσουν θέση φτιάχνουν λογαριασμό σε ένα λεπτό.', 'They answer in one tap, no account needed. To hold a seat they sign up in a minute.')}
      </p>

      <div className="mt-3">
        <InviteCover cover={cover} event={event} hostFirstName={host?.name.split(' ')[0]} goingCount={group.members.length + going.length} seatsLeft={seatsLeft} />
      </div>

      {/* Once the link exists, the cover picker folds away (declutter, Φ28). */}
      {invite && !coverOpen ? (
        <button
          type="button"
          onClick={() => setCoverOpen(true)}
          className="mt-2 inline-flex min-h-9 items-center text-xs font-bold text-ink underline underline-offset-2"
        >
          {t(`Αλλαγή εξωφύλλου (${t(cover.el, cover.en)})`, `Change cover (${t(cover.el, cover.en)})`)}
        </button>
      ) : (
      <fieldset className="mt-3">
        <legend className="text-xs font-bold text-ink">{t('Εξώφυλλο', 'Cover')}</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {covers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c.id)}
              aria-pressed={cover.id === c.id}
              className={cn(
                'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold text-ink',
                cover.id === c.id ? 'border-ink' : 'border-border hover:border-border-strong',
              )}
            >
              <span aria-hidden className="h-4 w-4 rounded-full border border-border" style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
              {t(c.el, c.en)}
            </button>
          ))}
        </div>
      </fieldset>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {invite ? (
          <>
            <Button size="sm" onClick={() => void copy()}>
              {copied ? <Check className="mr-1.5 h-4 w-4" aria-hidden /> : <Copy className="mr-1.5 h-4 w-4" aria-hidden />}
              {copied ? t('Αντιγράφηκε', 'Copied') : t('Αντιγραφή συνδέσμου', 'Copy link')}
            </Button>
            <Button size="sm" variant="outline" onClick={share}>
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden /> {t('Κοινοποίηση', 'Share')}
            </Button>
            <Link to={`/i/${invite.id}`} className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold text-ink underline underline-offset-2">
              {t('Δες τη σελίδα', 'View the page')}
            </Link>
          </>
        ) : (
          <Button size="sm" onClick={createInvite} disabled={seatsLeft === 0}>
            <Link2 className="mr-1.5 h-4 w-4" aria-hidden /> {t('Φτιάξε σύνδεσμο πρόσκλησης', 'Create invite link')}
          </Button>
        )}
      </div>
      {seatsLeft === 0 && !invite && (
        <p className="mt-2 text-xs font-medium text-ink-muted">{t('Η ομάδα είναι πλήρης.', 'The group is full.')}</p>
      )}

      {invite && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-bold text-ink">
            {t(`Απαντήσεις: ${going.length} έρχονται · ${maybe.length} ίσως`, `Answers: ${going.length} going · ${maybe.length} maybe`)}
          </p>
          {responses.length > 0 ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={t('Ποιοι απάντησαν (το βλέπεις μόνο εσύ)', 'Who answered (only you see this)')}>
              {responses.map((r) => (
                <li key={r.id} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-ink">
                  {r.name} · {r.status === 'going' ? t('έρχεται', 'going') : r.status === 'maybe' ? t('ίσως', 'maybe') : t('όχι', 'no')}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 space-y-2">
              <p className="text-xs font-medium text-ink-muted">{t('Δεν έχει απαντήσει κανείς ακόμη.', 'Nobody has answered yet.')}</p>
              <Button size="sm" variant="ghost" onClick={() => void share()}>
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden /> {t('Στείλε ξανά τον σύνδεσμο', 'Share the link again')}
              </Button>
            </div>
          )}
          {/* Upstream removed the always-on aside; only the exception is said: the link
              did not reach the server, so it opens on this device only. */}
          {!invite.remoteSyncedAt && (
            <p className="mt-2 text-2xs font-medium text-ink-muted">
              {t('Ο σύνδεσμος ανοίγει προς το παρόν μόνο σε αυτή τη συσκευή.', 'For now the link opens on this device only.')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
