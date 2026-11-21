import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { MessageCircle, MapPin, Calendar, Clock, ShieldAlert, CheckCircle, XCircle, Users, CalendarClock, CalendarCheck, Compass, PartyPopper } from 'lucide-react';
import { useStore } from '../../store';
import { Link, useNavigate } from 'react-router-dom';
import { parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { TabBar } from '../common/TabBar';
import { Modal } from '../common/Modal';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { cn } from '../../lib/utils';
import { PersonAvatar } from '../wall/PersonAvatar';
import { PLANS_TYPO } from '../../lib/typographyTokens';
import type { Group } from '../../types';
import { formatPlanWhen } from '../../lib/dateLocale';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { eventStartMs, LATE_CANCEL_MS } from '../../store/outingsSlice';
import { isLiveCatalogEvent } from '../../lib/eventDisplay';
import { EmptyState } from '../common/EmptyState';
import { formatCountdown } from '../../lib/countdown';
import { DiscoverCardImagePicker } from '../home/DiscoverCardImagePicker';
import { useDiscoverCardImageDepth } from '../../hooks/useDiscoverCardImageDepth';
import { CardImageDepthFrame } from '../events/CardImageDepthFrame';
import { cardImageDepthFlags } from '../../lib/discoverCardImagePreview';
import { GroupProgressBar } from '../events/GroupProgressBar';

function getUserGroupForEvent(eventId: string, groups: Group[], userId: string | undefined) {
  if (!userId) return undefined;
  return groups.find((g) => g.eventId === eventId && g.members.includes(userId));
}

function getPendingGroupForEvent(eventId: string, groups: Group[]) {
  return groups.find((g) => g.eventId === eventId && g.status === 'pending');
}

function isPlansFormingGroupId(groupId: string) {
  return groupId.startsWith('g_plan_') || groupId.startsWith('g_merged_') || groupId.startsWith('g_coord_');
}

export default function PlansPageContent() {
  const { t, tu, language } = useLanguage();
  const p = usePageContrast();
  const cardImage = useDiscoverCardImageDepth();
  const flags = cardImageDepthFlags(cardImage.depth);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const navigate = useNavigate();

  const { events, isLoading, isError, refetch } = useEventsResource();
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const waitlistedEvents = useStore((s) => s.waitlistedEvents);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const leaveGroup = useStore((s) => s.leaveGroup);
  const joinGroup = useStore((s) => s.joinGroup);

  const now = new Date(nowMs);
  const userGroupEventIds = currentUser
    ? groups
        .filter((g) => g.status !== 'cancelled' && g.members.includes(currentUser.id))
        .map((g) => g.eventId)
    : [];

  // Date and time together: a plan later today is still upcoming, not history
  // waiting for a rating (a date-only string parses as midnight UTC).
  const upcomingEvents = events.filter(e => {
    const start = eventStartMs(e);
    return isLiveCatalogEvent(e) && start !== null && start >= nowMs && userGroupEventIds.includes(e.id);
  }).sort((a, b) => (eventStartMs(a) ?? 0) - (eventStartMs(b) ?? 0));

  const pendingEvents = events.filter(e => waitlistedEvents.includes(e.id) && !userGroupEventIds.includes(e.id));

  const pastEvents = events.filter(e => {
    const start = eventStartMs(e);
    return isLiveCatalogEvent(e) && start !== null && start < nowMs && userGroupEventIds.includes(e.id);
  }).sort((a, b) => (eventStartMs(b) ?? 0) - (eventStartMs(a) ?? 0));

  const needsRating = pastEvents.filter(e => !feedbackSubmitted[e.id]).length;
  const nextEvent = upcomingEvents[0];
  const nextEventDays = nextEvent ? differenceInDays(parseISO(nextEvent.date), now) : null;
  // Φ27 — say what leaving means before it happens (seat hand-over / late cancel).
  const leaveNote = (() => {
    if (!showLeaveConfirm) return null;
    const g = getUserGroupForEvent(showLeaveConfirm, groups, currentUser?.id);
    const ev = events.find((e) => e.id === showLeaveConfirm);
    if (!g || !ev) return null;
    if (g.members.length >= g.targetSize && g.waitlist?.length) {
      return {
        el: 'Η θέση σου θα περάσει στο πρώτο άτομο της λίστας αναμονής, χωρίς επίπτωση για σένα.',
        en: 'Your seat will pass to the first person on the waitlist, with no consequence for you.',
      };
    }
    const start = eventStartMs(ev);
    if (g.status === 'confirmed' && start !== null && start > Date.now() && start - Date.now() < LATE_CANCEL_MS) {
      return {
        el: 'Λιγότερο από 24 ώρες πριν: καταγράφεται αργή ακύρωση (−8 αξιοπιστία), με δυνατότητα ένστασης.',
        en: 'Less than 24 hours before: a late cancel is recorded (−8 reliability), and you can appeal.',
      };
    }
    return null;
  })();

  usePublishPageSnapshot({
    titleEl: 'Τα Σχέδιά μου',
    titleEn: 'My Plans',
    state: activeTab,
    summaryEl: `${upcomingEvents.length} επερχόμενα · ${pendingEvents.length} εκκρεμή · ${needsRating} χωρίς αξιολόγηση`,
    summaryEn: `${upcomingEvents.length} upcoming · ${pendingEvents.length} pending · ${needsRating} without review`,
    visibleIds: upcomingEvents.slice(0, 8).map((e) => e.id),
  });

  const secondaryBtn = cn(
    'px-3.5 py-1.5 min-h-8 rounded-xl transition-all duration-200 border text-xs font-bold',
    p.isDark
      ? 'border-white/15 hover:border-white/30 text-gray-100 hover:bg-white/5'
      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700',
  );

  return (
    <div className="mx-auto max-w-full space-y-4 md:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className={cn(PLANS_TYPO.pageTitle, p.head)}>{t(`Τα Σχέδιά μου`, `My Plans`)}</h1>
      </div>
      <DiscoverCardImagePicker
        depth={cardImage.depth}
        options={cardImage.options}
        onChange={cardImage.setDepth}
      />

      {/* Next-event highlight */}
      {nextEvent && nextEventDays !== null && nextEventDays <= 7 && (
        <button
          type="button"
          onClick={() => {
            const g = getUserGroupForEvent(nextEvent.id, groups, currentUser?.id);
            navigate(g ? `/night/${g.id}` : `/events/${nextEvent.id}`);
          }}
          className={cn('!rounded-2xl p-4 flex items-center gap-3 w-full text-left transition-shadow hover:shadow-soft', p.highlightRow)}
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', p.statBg)}>
            <CalendarClock className={cn('w-5 h-5', p.statVal)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-xs font-bold tracking-wide', p.muted)}>{tu('Επόμενη εκδήλωση', 'Next up')}</p>
            <p className={cn(PLANS_TYPO.nextTitle, p.head)}>{nextEvent.title}</p>
          </div>
          <span className={cn('shrink-0 text-xs font-bold px-2.5 py-1 rounded-full', p.statBg, p.statVal)}>
            {eventStartMs(nextEvent) === null
              ? t('Σύντομα', 'Soon')
              : formatCountdown(eventStartMs(nextEvent)!, nowMs, language)}
          </span>
        </button>
      )}

      <TabBar
        tabs={[
          { id: 'upcoming', label: t('Επερχόμενα', 'Upcoming'), count: upcomingEvents.length },
          { id: 'pending', label: t('Εκκρεμή', 'Pending'), count: pendingEvents.length },
          { id: 'past', label: t('Ιστορικό', 'Past'), count: pastEvents.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'upcoming' | 'pending' | 'past')}
      />

      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`plans-sk-${i}`} />
            ))}
          </div>
        }
        errorTitle={t('Αδυναμία φόρτωσης σχεδίων', 'Could not load plans')}
      >
      {activeTab === 'upcoming' && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingEvents.map(event => {
          const group = getUserGroupForEvent(event.id, groups, currentUser?.id);
          const memberUsers = (group?.members ?? [])
            .slice(0, 3)
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean);
          const isConfirmed = group?.status === 'confirmed';
          const hasMeetingPoint = Boolean(group?.meetingPoint);

          return (
          <Card key={event.id} className="!rounded-2xl p-0 overflow-hidden flex h-full flex-col">
            <CardImageDepthFrame
              event={event}
              depth={cardImage.depth}
              onPhotoClick={() => navigate(`/events/${event.id}`)}
              top={
                isConfirmed ? (
                  <div className="absolute top-2 left-2 z-10 bg-brand/95 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                    {t('Επιβεβαιωμένο', 'Confirmed')}
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 z-10 bg-amber-600/95 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                    {t('Εκκρεμής', 'Pending')}
                  </div>
                )
              }
              overlay={
                <>
                  <div>
                    <h3 className={cn(PLANS_TYPO.cardTitle, 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]')}>{event.title}</h3>
                    {group && isPlansFormingGroupId(group.id) && (
                      <p className="card-meta mt-0.5 text-white/80">
                        {t('Από Βρες Nakamas', 'From Find Nakamas')}
                      </p>
                    )}
                  </div>
                  {flags.coverFacts && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-white">
                      <div className="flex items-center text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatPlanWhen(event.date, event.time, language)}
                      </div>
                      <div className="flex items-center text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {hasMeetingPoint
                          ? t('Σημείο συνάντησης ενεργό', 'Meeting point active')
                          : t('Σημείο συνάντησης — εκκρεμεί', 'Meeting point — pending')}
                      </div>
                      <div className="flex items-center text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" /> {event.duration}
                      </div>
                    </div>
                  )}
                  {flags.coverOrganizer && group && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {memberUsers.map((user) => (
                          <PersonAvatar key={user!.id} user={user!} size="sm" className="h-6 w-6 ring-1 ring-white/40" />
                        ))}
                      </div>
                      {/* With the progress bar on the photo, the count is said once, there. */}
                      {!flags.coverProgress && (
                        <span className="text-xs font-medium flex items-center gap-0.5 text-white/85">
                          <Users className="w-3 h-3" /> {group.members.length}/{group.targetSize} {t('μέλη', 'members')}
                        </span>
                      )}
                    </div>
                  )}
                  {flags.coverRoomy && <div className="min-h-16 flex-1" aria-hidden />}
                  {flags.coverProgress && (
                    <div className="mt-auto border-t border-white/25 pt-4">
                      {group && (
                        <GroupProgressBar
                          current={group.members.length}
                          target={group.targetSize}
                          onPhoto
                          className={flags.coverFull ? 'mb-3' : undefined}
                        />
                      )}
                      {flags.coverFull && (
                        <div className="flex flex-wrap items-center gap-2">
                          {group && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/night/${group.id}`)}
                                className="inline-flex btn-gradient !py-1.5 min-h-8 items-center justify-center gap-1.5"
                              >
                                <PartyPopper className="h-3.5 w-3.5" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/chat/${group.id}`)}
                                className="min-h-8 px-3 rounded-xl text-xs font-bold text-white/90 border border-white/30"
                              >
                                {t('Συνομιλία', 'Chat')}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowLeaveConfirm(event.id)}
                            className="min-h-8 px-2 text-xs font-semibold text-white/80 hover:text-red-200 flex items-center gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden /> {t('Αποχώρηση', 'Leave')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              }
            >
            <div className="flex flex-1 flex-col gap-3.5 px-4 py-4">
              {!flags.coverTitle && (
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className={cn(PLANS_TYPO.cardTitle, p.head)}>
                    <Link
                      to={`/events/${event.id}`}
                      className="tap-area-y rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {event.title}
                    </Link>
                  </h3>
                  {group && isPlansFormingGroupId(group.id) && (
                    <p className={cn('card-meta mt-0.5', p.muted)}>
                      {t('Από Βρες Nakamas', 'From Find Nakamas')}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={cn(PLANS_TYPO.cardDate, p.head)}>{formatPlanWhen(event.date, event.time, language)}</div>
                </div>
              </div>
              )}
              {flags.coverTitle && !flags.coverFacts && (
                <div className={cn(PLANS_TYPO.cardDate, p.head)}>{formatPlanWhen(event.date, event.time, language)}</div>
              )}

              {!flags.coverFacts && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <div className={cn(
                  'flex items-center text-xs font-medium',
                  hasMeetingPoint ? p.body : p.muted,
                )}>
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {hasMeetingPoint
                    ? t('Σημείο συνάντησης ενεργό', 'Meeting point active')
                    : t('Σημείο συνάντησης — εκκρεμεί', 'Meeting point — pending')}
                </div>
                <div className={cn('flex items-center text-xs font-medium', p.body)}>
                  <Clock className="w-3.5 h-3.5 mr-1" /> {event.duration}
                </div>
              </div>
              )}

              {!flags.coverOrganizer && group && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {memberUsers.map((user) => (
                      <PersonAvatar key={user!.id} user={user!} size="sm" className="h-6 w-6" />
                    ))}
                  </div>
                  <span className={cn('text-xs font-medium flex items-center gap-0.5', p.muted)}>
                    <Users className="w-3 h-3" /> {group.members.length}/{group.targetSize} {t('μέλη', 'members')}
                  </span>
                </div>
              )}

              {group && (
                <button
                  type="button"
                  onClick={() => navigate(`/night/${group.id}`)}
                  className="inline-flex btn-gradient !py-1.5 min-h-8 items-center justify-center gap-1.5 self-start"
                >
                  {/* «Επιβεβαιωμένο» is already on the photo — the button just says where it goes. */}
                  <PartyPopper className="h-3.5 w-3.5" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
                </button>
              )}

              <div className={cn('mt-auto pt-3.5 border-t flex flex-wrap items-center gap-2', p.borderT)}>
                <button
                  onClick={() => group && navigate(`/chat/${group.id}`)}
                  disabled={!group}
                  className={cn(secondaryBtn, 'flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> {t('Συνομιλία', 'Chat')}
                </button>
                {/* Leaving stays one tap away, but quiet: it is confirmed in a dialog. */}
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(event.id)}
                  className={cn(
                    'min-h-8 px-2 text-xs font-semibold flex items-center gap-1 transition-colors',
                    p.isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-700',
                  )}
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden /> {t('Αποχώρηση', 'Leave')}
                </button>
              </div>
            </div>
            </CardImageDepthFrame>
          </Card>
          );
        })}

        {upcomingEvents.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Compass}
              character="explorer"
              title={t(`Κανένα επερχόμενο σχέδιο`, `No upcoming plans`)}
              actionLabel={t(`Ανακάλυψη`, `Discover`)}
              onAction={() => navigate('/')}
              askAi
              askPrompt={t(
                'Βρες μου κάτι για αυτό το Σαββατοκύριακο με ανοιχτές θέσεις.',
                'Find me something this weekend with open spots.',
              )}
              className="py-8"
            />
          </div>
        )}
      </div>
      )}

      {activeTab === 'pending' && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pendingEvents.map(event => {
          const group =
            getPendingGroupForEvent(event.id, groups) ??
            groups.find(
              (g) =>
                g.eventId === event.id &&
                Boolean(currentUser) &&
                (g.waitlist?.includes(currentUser!.id) || g.pendingMembers?.includes(currentUser!.id)),
            );
          const needed = group ? Math.max(0, group.targetSize - group.members.length) : 0;

          return (
          <Card key={event.id} className="!rounded-2xl p-0 overflow-hidden opacity-80 hover:opacity-100 transition-all duration-200 flex h-full flex-col">
            <CardImageDepthFrame
              event={event}
              depth={cardImage.depth}
              onPhotoClick={() => navigate(`/events/${event.id}`)}
              grayscale
              top={
                <div className="absolute top-2 left-2 z-10 bg-gray-800/90 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                  {t(`Εκκρεμής ομάδα`, `Pending Group`)}
                </div>
              }
              overlay={
                <>
                  <h3 className={cn(PLANS_TYPO.cardTitle, 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]')}>{event.title}</h3>
                  {flags.coverFacts && (
                    <p className="card-copy-sm font-medium text-white/85">
                      {formatPlanWhen(event.date, event.time, language)}
                      {needed > 0
                        ? ` · ${
                            needed === 1
                              ? t('Αναμονή για 1 άτομο', 'Waiting for 1 person')
                              : t(`Αναμονή για ${needed} άτομα`, `Waiting for ${needed} people`)
                          }`
                        : ''}
                    </p>
                  )}
                  {flags.coverRoomy && <div className="min-h-16 flex-1" aria-hidden />}
                  {flags.coverProgress && (
                    <div className="mt-auto border-t border-white/25 pt-4">
                      {group && (
                        <GroupProgressBar current={group.members.length} target={group.targetSize} onPhoto className={flags.coverFull ? 'mb-3' : undefined} />
                      )}
                      {flags.coverFull && (
                        <div className="flex flex-wrap items-center gap-2">
                          {group && (
                            <button
                              type="button"
                              onClick={() => navigate(`/night/${group.id}`)}
                              className="inline-flex btn-gradient !py-1.5 min-h-8 items-center justify-center gap-1.5"
                            >
                              <PartyPopper className="h-4 w-4" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="min-h-8 px-3 rounded-xl text-xs font-bold text-white/90 border border-white/30"
                          >
                            {t('Κατάσταση', 'View Status')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              }
            >
            <div className="flex flex-1 flex-col gap-3.5 px-4 py-4">
              {!flags.coverTitle && (
              <div className="flex justify-between items-start gap-2">
                <h3 className={cn(PLANS_TYPO.cardTitle, p.head)}>{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className={cn(PLANS_TYPO.cardDate, p.head)}>{formatPlanWhen(event.date, event.time, language)}</div>
                </div>
              </div>
              )}
              {flags.coverTitle && !flags.coverFacts && (
                <div className={cn(PLANS_TYPO.cardDate, p.head)}>{formatPlanWhen(event.date, event.time, language)}</div>
              )}

              <p className={cn('card-copy-sm font-medium', p.sub)}>
                {needed === 1
                  ? t(
                      'Δήλωσες ενδιαφέρον. Αναμονή για 1 ακόμα άτομο για να επιβεβαιωθεί η ομάδα.',
                      'You expressed interest. Waiting for 1 more person to confirm the group and unlock the meeting point.',
                    )
                  : t(
                      `Δήλωσες ενδιαφέρον. Αναμονή για ${needed} ακόμα άτομα για να επιβεβαιωθεί η ομάδα.`,
                      `You expressed interest. Waiting for ${needed} more people to confirm the group and unlock the meeting point.`,
                    )}
              </p>

              <div className={cn('mt-auto pt-4 border-t flex gap-2', p.borderT)}>
                {group && (
                  <button
                    type="button"
                    onClick={() => navigate(`/night/${group.id}`)}
                    className={cn(secondaryBtn, 'flex items-center justify-center gap-1.5')}
                  >
                    <PartyPopper className="h-4 w-4" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
                  </button>
                )}
                <button onClick={() => navigate(`/events/${event.id}`)} className={secondaryBtn}>
                  {t(`Κατάσταση`, `View Status`)}
                </button>
              </div>
            </div>
            </CardImageDepthFrame>
          </Card>
          );
        })}

        {pendingEvents.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Clock}
              character="crew"
              title={t('Καμία εκκρεμής ομάδα', 'No pending groups')}
              actionLabel={t('Ανακάλυψη', 'Discover')}
              onAction={() => navigate('/')}
              askAi
              askPrompt={t(
                'Δείξε μου ομάδες που σχηματίζονται κοντά μου.',
                'Show me groups forming near me.',
              )}
              className="py-8"
            />
          </div>
        )}
      </div>
      )}

      {activeTab === 'past' && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {needsRating > 0 && (
          <div className={cn('col-span-full text-xs font-semibold flex items-center gap-1.5', p.muted)}>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            {needsRating === 1
              ? t('1 εκδήλωση περιμένει την αξιολόγησή σου', '1 event awaiting your feedback')
              : t(`${needsRating} εκδηλώσεις περιμένουν την αξιολόγησή σου`, `${needsRating} events awaiting your feedback`)}
          </div>
        )}
        {pastEvents.map((event) => (
          <Card key={event.id} className="!rounded-2xl p-0 overflow-hidden flex h-full flex-col">
            <CardImageDepthFrame
              event={event}
              depth={cardImage.depth}
              onPhotoClick={() => navigate(`/events/${event.id}`)}
              overlay={
                <>
                  <h3 className={cn(PLANS_TYPO.cardTitle, 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]')}>{event.title}</h3>
                  {flags.coverFacts && (
                    <div className="flex items-center gap-2 text-xs font-bold text-white/85">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatPlanWhen(event.date, event.time, language)}
                    </div>
                  )}
                  {flags.coverRoomy && <div className="min-h-16 flex-1" aria-hidden />}
                  {flags.coverFull && (
                    <div className="mt-auto">
                      {!feedbackSubmitted[event.id] ? (
                        <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="btn-gradient !py-1.5 !px-4">
                          {t(`Αξιολόγηση`, `Rate Experience`)}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                          <CheckCircle className="w-4 h-4" /> {t(`Αξιολόγηση υποβλήθηκε`, `Feedback submitted`)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              }
            >
            <div className="flex flex-1 flex-col gap-3.5 px-4 py-4">
              {!flags.coverFacts && (
                <div className={cn('flex items-center gap-2 text-xs font-bold', p.muted)}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatPlanWhen(event.date, event.time, language)}
                </div>
              )}
              {!flags.coverTitle && <h3 className={cn(PLANS_TYPO.cardTitle, p.head)}>{event.title}</h3>}

              {!feedbackSubmitted[event.id] ? (
                <div className={cn('p-3 rounded-2xl flex items-center justify-between mt-auto border', p.statBg)}>
                  <div className={cn('text-xs font-bold', p.statVal)}>{t(`Απαιτείται αξιολόγηση`, `Feedback required`)}</div>
                  <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="btn-gradient !py-1.5 !px-4">
                    {t(`Αξιολόγηση`, `Rate Experience`)}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-auto text-xs font-bold text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> {t(`Αξιολόγηση υποβλήθηκε`, `Feedback submitted`)}
                </div>
              )}
            </div>
            </CardImageDepthFrame>
          </Card>
        ))}

        {pastEvents.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={CalendarCheck}
              character="spark"
              title={t('Κανένα ολοκληρωμένο σχέδιο', 'No completed plans yet')}
              actionLabel={t('Ανακάλυψη', 'Discover')}
              onAction={() => navigate('/')}
              askAi
              className="py-8"
            />
          </div>
        )}
      </div>
      )}
      </ResourceStateGate>

      <Modal
        open={Boolean(showLeaveConfirm)}
        onClose={() => setShowLeaveConfirm(null)}
        title={t('Αποχώρηση από ομάδα', 'Leave Group')}
        size="sm"
      >
        <p className="text-xs font-medium mb-2 text-ink-muted">
          {t('Θέλεις σίγουρα να αποχωρήσεις; Μπορεί να μην μπορέσεις να ξαναμπείς.', 'Are you sure you want to leave? You might not be able to rejoin.')}
        </p>
        {leaveNote && <p className="text-xs font-bold mb-4 text-ink">{t(leaveNote.el, leaveNote.en)}</p>}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-autofocus
            onClick={() => {
              // The group *I* am in for this event (not just the first group of the event).
              const group = getUserGroupForEvent(showLeaveConfirm ?? '', groups, currentUser?.id);
              const gid = group?.id;
              const handsOver = Boolean(group?.waitlist?.length);
              if (gid) leaveGroup(gid);
              toast.info(t('Αποχώρησες από την ομάδα.', 'You have left the group.'), {
                action: handsOver
                  ? {
                      label: t('Βρες Nakamas', 'Find Nakamas'),
                      onClick: () => navigate('/buddy-seek'),
                    }
                  : {
                      label: t('Αναίρεση', 'Undo'),
                      onClick: () => {
                        if (gid) joinGroup(gid);
                      },
                    },
              });
              setShowLeaveConfirm(null);
            }}
            className="w-full px-4 py-2 min-h-9 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-soft"
          >
            {t('Ναι, αποχώρηση', 'Yes, Leave')}
          </button>
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(null)}
            className={cn('w-full px-4 py-2 min-h-9 text-xs font-bold rounded-full transition-all duration-200 border', secondaryBtn)}
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
