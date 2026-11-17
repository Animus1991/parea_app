import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  LifeBuoy,
  ListOrdered,
  Lock,
  MapPin,
  MessageCircle,
  PartyPopper,
  Repeat2,
  Share2,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { PAGE_FILL } from '../layout/PageShell';
import { cn } from '../../lib/utils';
import { formatOutingDate, groupStatusLabel } from '../../lib/outings';
import { coverById, coversFor } from '../../lib/planCovers';
import { eventStartMs, isDoorPerson, LATE_CANCEL_MS } from '../../store/outingsSlice';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { PersonAvatar } from '../wall/PersonAvatar';
import { CheckInTicket } from './CheckInTicket';
import { CheckInPanel } from './CheckInPanel';
import { GroupInsights } from './GroupInsights';
import { HikeRouteCard } from './HikeRouteCard';
import { InvitePanel } from './InvitePanel';
import { GroupTicketsPanel } from './GroupTicketsPanel';
import { PreMeetCard } from './PreMeetCard';
import type { User } from '../../types';

const ShareToWallModal = lazy(() => import('../wall/ShareToWallModal'));

const TIER = {
  '3_high_trust': { el: 'Υψηλή εμπιστοσύνη', en: 'High trust' },
  '2_confirmed': { el: 'Επιβεβαιωμένο', en: 'Confirmed' },
  '1_explorer': { el: 'Νέο μέλος', en: 'New member' },
} as const;

function seenKey(groupId: string) {
  return `nakamas-ready-seen:${groupId}`;
}

/**
 * «Η βραδιά μας» — everything a group needs on the night, in one place: the
 * «Η παρέα σου είναι έτοιμη» moment, door ticket / check-in, meeting point
 * and «Συνάντηση πριν», the group code, who is coming, the route, inviting
 * friends, group tickets, the waitlist and safety.
 */
export default function OurNightPageContent() {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const invites = useStore((s) => s.planInvites);
  const leaveGroup = useStore((s) => s.leaveGroup);
  const joinGroup = useStore((s) => s.joinGroup);
  const leaveGroupWaitlist = useStore((s) => s.leaveGroupWaitlist);
  const joinGroupWaitlist = useStore((s) => s.joinGroupWaitlist);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [shareWallOpen, setShareWallOpen] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  const event = group ? events.find((e) => e.id === group.eventId) : undefined;
  const members = useMemo(
    () => (group ? group.members.map((id) => users.find((u) => u.id === id)).filter((u): u is User => Boolean(u)) : []),
    [group, users],
  );

  const isMember = Boolean(me && group?.members.includes(me.id));
  const onWaitlist = Boolean(me && group?.waitlist?.includes(me.id));
  const isHost = Boolean(group && isDoorPerson(group, me?.id));
  const revealed = group?.status === 'confirmed' || group?.status === 'completed';
  const host = users.find((u) => u.id === (group?.hostId ?? group?.members[0]));

  // «Η παρέα σου είναι έτοιμη» — shown big the first time, then as a banner.
  const [firstReady] = useState(() => {
    if (!group || !revealed) return false;
    try {
      return !localStorage.getItem(seenKey(group.id));
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!group || !revealed || !isMember) return;
    try {
      localStorage.setItem(seenKey(group.id), new Date().toISOString());
    } catch {
      /* storage unavailable — the moment just shows again next time */
    }
  }, [group, revealed, isMember]);

  usePublishPageSnapshot({
    titleEl: 'Η βραδιά μας',
    titleEn: 'Our night',
    summaryEl: event ? `${event.title} · ${members.length}/${group?.targetSize} μέλη` : 'Η ομάδα δεν βρέθηκε',
    summaryEn: event ? `${event.title} · ${members.length}/${group?.targetSize} members` : 'Group not found',
  });

  if (!me) return null;
  if (!group || !event) {
    return (
      <div className={cn(PAGE_FILL, 'py-6')}>
        <EmptyState
          title={t('Η ομάδα δεν βρέθηκε', 'Group not found')}
          description={t('Ίσως διαγράφηκε ή ο σύνδεσμος είναι λάθος.', 'It may have been removed, or the link is wrong.')}
          actionLabel={t('Τα σχέδιά μου', 'My plans')}
          onAction={() => navigate('/plans')}
          secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
          onSecondary={() => navigate('/buddy-seek')}
        />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className={cn(PAGE_FILL, 'space-y-4 py-4')}>
        <h1 className={cn(APP_TYPO.pageTitle, 'text-ink')}>{t('Η βραδιά μας', 'Our night')}</h1>
        <div className="rounded-2xl border border-border bg-surface-raised p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Lock className="h-4 w-4" aria-hidden /> {t('Αυτή η σελίδα είναι για τα μέλη της ομάδας.', 'This page is for group members.')}
          </p>
          {onWaitlist && (
            <p className="mt-2 text-xs font-medium text-ink">
              {t(
                `Είσαι ${(group.waitlist ?? []).indexOf(me.id) + 1}ος/η στη λίστα αναμονής. Αν ελευθερωθεί θέση, περνά σε σένα στην ίδια τιμή.`,
                `You are #${(group.waitlist ?? []).indexOf(me.id) + 1} on the waitlist. If a seat frees up, it passes to you at the same price.`,
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => navigate(`/events/${event.id}`)}>
              {t('Δες την εκδήλωση', 'See the event')}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/buddy-seek')}
              className="text-xs font-bold text-ink underline underline-offset-2"
            >
              {t('Βρες Nakamas', 'Find Nakamas')}
            </button>
            {onWaitlist && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const gid = group.id;
                  leaveGroupWaitlist(gid);
                  toast.message(t('Αποχώρησες από τη λίστα αναμονής.', 'You left the waitlist.'), {
                    action: {
                      label: t('Αναίρεση', 'Undo'),
                      onClick: () => {
                        joinGroupWaitlist(gid);
                      },
                    },
                  });
                }}
              >
                {t('Αποχώρηση από τη λίστα', 'Leave the waitlist')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const myInvite = invites.find((i) => i.groupId === group.id);
  const cover = coverById(myInvite?.coverId, event.category) ?? coversFor(event.category)[0];
  const start = eventStartMs(event);
  const now = Date.now();
  const lateIfLeaving =
    group.status === 'confirmed' && start !== null && start > now && start - now < LATE_CANCEL_MS && !(group.waitlist?.length && group.members.length >= group.targetSize);
  const handsOver = group.members.length >= group.targetSize && Boolean(group.waitlist?.length);
  const closed = Boolean(group.checkInClosedAt);
  const myRecord = group.checkIns?.[me.id];
  const canGiveFeedback = closed && myRecord && !feedbackSubmitted[event.id];
  const spotsLeft = Math.max(0, group.targetSize - group.members.length);

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6 animate-in fade-in duration-300')}>
      <button
        type="button"
        onClick={() => navigate('/plans')}
        className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('Τα σχέδιά μου', 'My plans')}
      </button>

      {/* The moment */}
      <header
        className={cn('relative overflow-hidden rounded-3xl p-5 shadow-soft', firstReady && 'animate-in zoom-in-95 duration-500')}
        style={{ backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})`, color: cover.ink }}
      >
        <p className="flex items-center gap-1.5 text-xs font-bold">
          {revealed ? <PartyPopper className="h-4 w-4" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
          {groupStatusLabel(group, t)}
        </p>
        <h1 className={cn('mt-1', APP_TYPO.pageTitle, 'font-black')}>{t('Η βραδιά μας', 'Our night')}</h1>
        <p className="mt-0.5 text-sm font-bold">{event.title}</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden /> {formatOutingDate(event.date, language)}
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden /> {event.time}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden /> {event.locationArea}
          </li>
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 6).map((m) => (
              <PersonAvatar key={m.id} user={m} size="sm" className="ring-2 ring-white" />
            ))}
          </div>
          <span className="text-xs font-bold">
            {t(`${members.length}/${group.targetSize} μέλη`, `${members.length}/${group.targetSize} members`)}
            {spotsLeft > 0 ? t(` · ${spotsLeft} θέσεις ακόμη`, ` · ${spotsLeft} seats left`) : t(' · πλήρης', ' · full')}
          </span>
        </div>
        {firstReady && revealed && (
          <p className="mt-3 text-sm font-semibold">
            {group.discountUnlocked && group.code
              ? t('Όλα είναι έτοιμα: σημείο συνάντησης, κωδικός ομάδας και εισιτήριο πόρτας είναι παρακάτω.', 'All set: the meeting point, group code and door ticket are below.')
              : t('Όλα είναι έτοιμα: σημείο συνάντησης και εισιτήριο πόρτας είναι παρακάτω.', 'All set: the meeting point and door ticket are below.')}
          </p>
        )}
        {revealed && (
          <button
            type="button"
            onClick={() => setShareWallOpen(true)}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-current/30 bg-white/15 px-3 text-xs font-bold backdrop-blur-sm"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden /> {t('Μοιράσου στον τοίχο', 'Share to wall')}
          </button>
        )}
      </header>

      {canGiveFeedback && (
        <div
          role="region"
          aria-labelledby="night-feedback-title"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface-raised p-4"
        >
          <p id="night-feedback-title" className="flex items-center gap-2 text-sm font-bold text-ink">
            <Star className="h-4 w-4" aria-hidden /> {t('Πώς πήγε η βραδιά;', 'How was the night?')}
          </p>
          <Button size="sm" onClick={() => navigate(`/history/feedback/${event.id}`)}>
            {t('Αξιολόγηση', 'Feedback')}
          </Button>
        </div>
      )}

      {/* The host is checked in with the first arrival; everyone else shows a ticket. */}
      {!closed && !isHost && <CheckInTicket groupId={group.id} userId={me.id} record={myRecord} hostName={host?.name.split(' ')[0]} />}
      {isHost && <CheckInPanel group={group} members={members} />}

      <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="meet-title">
        <h3 id="meet-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <MapPin className="h-4 w-4" aria-hidden /> {t('Σημείο συνάντησης', 'Meeting point')}
        </h3>
        {revealed ? (
          <p className="mt-1 text-sm font-medium text-ink">{group.meetingPoint || event.exactLocation || event.locationArea}</p>
        ) : (
          <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-ink-muted">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('Το ακριβές σημείο φαίνεται όταν επιβεβαιωθεί η ομάδα.', 'The exact spot shows once the group is confirmed.')}
          </p>
        )}
      </section>

      <PreMeetCard group={group} event={event} isHost={isHost} revealed={revealed} />

      {group.discountUnlocked && group.code && (
        <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="code-title">
          <h3 id="code-title" className="flex items-center gap-2 text-sm font-bold text-ink">
            <Tag className="h-4 w-4" aria-hidden /> {t('Κωδικός ομάδας', 'Group code')}
          </h3>
          <p className="mt-2 font-mono text-base font-black tracking-widest text-ink" data-testid="group-code">
            {group.code}
          </p>
          <p className="mt-1 text-xs font-medium text-ink-muted">
            {event.groupDiscount
              ? t(`−${event.groupDiscount.percentage}% στο ταμείο και στο μέρος της «Συνάντησης πριν». Τον βλέπουν όλα τα μέλη.`, `−${event.groupDiscount.percentage}% at the door and at the «meet before» place. Every member sees it.`)
              : t('Δείξ’ τον στο ταμείο. Τον βλέπουν όλα τα μέλη.', 'Show it at the door. Every member sees it.')}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="who-title">
        <h3 id="who-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Users className="h-4 w-4" aria-hidden /> {t('Ποιοι έρχονται', 'Who is coming')}
        </h3>
        <ul className="mt-2 divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <PersonAvatar user={m} size="sm" />
              <span className="min-w-0 flex-1">
                <Link to={m.id === me.id ? '/profile' : `/u/${m.id}`} className="block truncate text-sm font-bold text-ink hover:underline">
                  {m.name}
                  {m.id === me.id ? t(' (εσύ)', ' (you)') : ''}
                  {m.id === group.hostId ? t(' · οικοδεσπότης', ' · host') : ''}
                </Link>
                <span className="flex flex-wrap items-center gap-x-2 text-2xs font-medium text-ink-muted">
                  <span>{t(TIER[m.trustTier].el, TIER[m.trustTier].en)}</span>
                  {m.selfieVerified && (
                    <span className="inline-flex items-center gap-0.5">
                      <BadgeCheck className="h-3 w-3" aria-hidden /> {t('Selfie', 'Selfie')}
                    </span>
                  )}
                  {m.idVerified && (
                    <span className="inline-flex items-center gap-0.5">
                      <BadgeCheck className="h-3 w-3" aria-hidden /> {t('Ταυτότητα', 'ID')}
                    </span>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <GroupInsights group={group} className="mt-2" />
      </section>

      {event.route && <HikeRouteCard route={event.route} revealStart={revealed} />}

      {spotsLeft > 0 && <InvitePanel group={group} event={event} />}

      <GroupTicketsPanel group={group} event={event} members={members} isHost={isHost} />

      {(group.waitlist?.length || group.lastTransfer) && (
        <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="waitlist-title">
          <h3 id="waitlist-title" className="flex items-center gap-2 text-sm font-bold text-ink">
            <ListOrdered className="h-4 w-4" aria-hidden /> {t('Λίστα αναμονής', 'Waitlist')}
          </h3>
          {group.waitlist?.length ? (
            <p className="mt-1 text-xs font-medium text-ink">
              {t(
                `${group.waitlist.length} ${group.waitlist.length === 1 ? 'άτομο περιμένει' : 'άτομα περιμένουν'}. Αν κάποιος αποχωρήσει, η θέση περνά αυτόματα στο πρώτο, στην ίδια τιμή, και η ομάδα κρατά την έκπτωση.`,
                `${group.waitlist.length} waiting. If someone leaves, the seat passes to the first one automatically, at the same price, and the group keeps its discount.`,
              )}
            </p>
          ) : null}
          {group.lastTransfer && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Repeat2 className="h-3.5 w-3.5" aria-hidden />
              {t('Τελευταία μεταβίβαση θέσης: ', 'Last seat hand-over: ')}
              {new Date(group.lastTransfer.at).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB')}
              {group.lastTransfer.price ? ` · ${group.lastTransfer.price.toFixed(2)} €` : ''}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="safety-title">
        <h3 id="safety-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <LifeBuoy className="h-4 w-4" aria-hidden /> {t('Ασφάλεια & επικοινωνία', 'Safety & contact')}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${group.id}`)}>
            <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden /> {t('Chat ομάδας', 'Group chat')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/trust')}>
            {t('Κέντρο Εμπιστοσύνης', 'Trust Center')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/report')}>
            {t('Αναφορά', 'Report')}
          </Button>
        </div>
        <p className="mt-2 text-2xs font-medium text-ink-muted">
          {t('Συναντιέστε πρώτα σε δημόσιο χώρο. Ενημέρωσε κάποιον δικό σου πού θα είσαι.', 'Meet in a public place first. Tell someone you trust where you will be.')}
        </p>
      </section>

      <CopilotInlinePrompt maxChips={2} title={{ el: 'Βοήθεια για τη βραδιά', en: 'Help for tonight' }} />

      {!closed && (
        <section className="rounded-2xl border border-border p-4" aria-labelledby="leave-title">
          <h3 id="leave-title" className="text-sm font-bold text-ink">
            {t('Δεν μπορείς τελικά;', 'Can’t make it?')}
          </h3>
          <p className="mt-1 text-xs font-medium text-ink-muted">
            {handsOver
              ? t('Η θέση σου θα περάσει στο πρώτο άτομο της λίστας αναμονής — χωρίς καμία επίπτωση για σένα.', 'Your seat will pass to the first person on the waitlist — with no consequence for you.')
              : lateIfLeaving
                ? t('Λιγότερο από 24 ώρες πριν: αν η θέση μείνει κενή, καταγράφεται αργή ακύρωση (−8 αξιοπιστία), με δυνατότητα ένστασης.', 'Less than 24 hours before: if the seat stays empty, a late cancel is recorded (−8 reliability), and you can appeal.')
                : t('Πες το νωρίς στο chat — έτσι η ομάδα προλαβαίνει να βρει κάποιον άλλον.', 'Say it early in the chat — so the group has time to find someone else.')}
          </p>
          {confirmLeave ? (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const willHandOver = handsOver;
                  const gid = group.id;
                  leaveGroup(gid);
                  toast.info(
                    willHandOver
                      ? t('Αποχώρησες — η θέση πέρασε στη λίστα αναμονής.', 'You left — your seat passed to the waitlist.')
                      : t('Αποχώρησες από την ομάδα.', 'You have left the group.'),
                    {
                      action: willHandOver
                        ? {
                            label: t('Βρες Nakamas', 'Find Nakamas'),
                            onClick: () => navigate('/buddy-seek'),
                          }
                        : {
                            label: t('Αναίρεση', 'Undo'),
                            onClick: () => joinGroup(gid),
                          },
                    },
                  );
                  navigate('/plans');
                }}
              >
                {t('Ναι, αποχώρηση', 'Yes, leave')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(false)}>
                {t('Μένω', 'I’ll stay')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setConfirmLeave(true)}>
              {t('Αποχώρηση από την ομάδα', 'Leave the group')}
            </Button>
          )}
        </section>
      )}

      {shareWallOpen && (
        <Suspense fallback={null}>
          <ShareToWallModal
            eventId={event.id}
            eventTitle={event.title}
            open={shareWallOpen}
            onClose={() => setShareWallOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
