import { useState } from 'react';
import { Card } from '../common/Card';
import { MessageCircle, MapPin, Calendar, Clock, ShieldAlert, CheckCircle, XCircle, Users, CalendarClock, CalendarCheck, Compass, PartyPopper } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours, isBefore } from 'date-fns';
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
import { dateFnsLocale, shortDayMonthPattern } from '../../lib/dateLocale';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { eventStartMs, LATE_CANCEL_MS } from '../../store/outingsSlice';
import { EmptyState } from '../common/EmptyState';

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
  const dateLocale = dateFnsLocale(language);
  const p = usePageContrast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  const { events, isLoading, isError, refetch } = useEventsResource();
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const waitlistedEvents = useStore((s) => s.waitlistedEvents);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const leaveGroup = useStore((s) => s.leaveGroup);
  const joinGroup = useStore((s) => s.joinGroup);

  const now = new Date();
  const userGroupEventIds = currentUser
    ? groups.filter(g => g.members.includes(currentUser.id)).map(g => g.eventId)
    : [];

  const upcomingEvents = events.filter(e => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && !isBefore(d, now) && userGroupEventIds.includes(e.id);
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingEvents = events.filter(e => waitlistedEvents.includes(e.id) && !userGroupEventIds.includes(e.id));

  const pastEvents = events.filter(e => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && isBefore(d, now) && userGroupEventIds.includes(e.id);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const needsRating = pastEvents.filter(e => !feedbackSubmitted[e.id]).length;
  const nextEvent = upcomingEvents[0];
  const nextEventDays = nextEvent ? differenceInDays(parseISO(nextEvent.date), now) : null;
  const showVerifyBanner = currentUser ? !currentUser.idVerified : false;

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
        <p className={cn(PLANS_TYPO.pageSub, 'mt-1', p.sub)}>{t(`Διαχείριση επερχόμενων, εκκρεμών και παρελθόντων εκδηλώσεων.`, `Manage your upcoming experiences, pending groups, and past events.`)}</p>
      </div>

      <CopilotInlinePrompt />

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
            <p className={cn('text-xs font-bold uppercase tracking-wide', p.muted)}>{tu('Επόμενη εκδήλωση', 'Next up')}</p>
            <p className={cn(PLANS_TYPO.nextTitle, p.head)}>{nextEvent.title}</p>
          </div>
          <span className={cn('shrink-0 text-xs font-bold px-2.5 py-1 rounded-full', p.statBg, p.statVal)}>
            {nextEventDays <= 0 ? t('Σήμερα', 'Today') : `${t('σε', 'in')} ${nextEventDays}${t('μ', 'd')}`}
          </span>
        </button>
      )}

      {/* Action required prompt — only when ID is not yet verified */}
      {showVerifyBanner && (
        <Card className={cn(
          '!rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4',
          p.isDark ? '!bg-amber-500/10 !border-amber-500/30' : '!bg-amber-50 !border-amber-200',
        )}>
          <div className="flex items-start gap-3">
            <ShieldAlert className={cn('w-5 h-5 shrink-0 mt-0.5', p.isDark ? 'text-amber-400' : 'text-amber-600')} />
            <div>
              <h3 className={cn(PLANS_TYPO.bannerTitle, 'mb-1', p.isDark ? 'text-amber-200' : 'text-amber-900')}>{t(`Επαληθεύστε την ταυτότητά σας`, `Verify your identity`)}</h3>
              <p className={cn(PLANS_TYPO.bannerBody, p.isDark ? 'text-amber-200/80' : 'text-amber-800')}>{t(`Ολοκληρώστε την επαλήθευση ταυτότητας για να ξεκλειδώσετε όλες τις εκδηλώσεις και τα σημεία συνάντησης.`, `Complete ID verification to unlock all events and meeting points.`)}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/verification')} className={cn('self-start sm:self-center w-auto bg-amber-600 text-white px-4 py-1.5 min-h-8 rounded-full shadow-soft hover:bg-amber-700 transition-all duration-200 whitespace-nowrap shrink-0', PLANS_TYPO.bannerCta)}>
            {t(`Επαλήθευση`, `Verify Now`)}
          </button>
        </Card>
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={`plans-sk-${i}`} />
            ))}
          </div>
        }
        errorTitle={t('Αδυναμία φόρτωσης σχεδίων', 'Could not load plans')}
      >
      {activeTab === 'upcoming' && (
      <div className="space-y-4">
        {upcomingEvents.map(event => {
          const group = getUserGroupForEvent(event.id, groups, currentUser?.id);
          const memberUsers = (group?.members ?? [])
            .slice(0, 3)
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean);
          const isConfirmed = group?.status === 'confirmed';
          const hasMeetingPoint = Boolean(group?.meetingPoint);

          return (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              {isConfirmed ? (
                <div className="absolute top-2 left-2 bg-brand/95 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                  {t('Επιβεβαιωμένο', 'Confirmed')}
                </div>
              ) : (
                <div className="absolute top-2 left-2 bg-amber-600/95 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                  {t('Εκκρεμής', 'Pending')}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className={cn(PLANS_TYPO.cardTitle, p.head)}>{event.title}</h3>
                  {group && isPlansFormingGroupId(group.id) && (
                    <p className={cn('card-meta mt-0.5', p.muted)}>
                      {t('Από Βρες Nakamas', 'From Find Nakamas')}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={cn(PLANS_TYPO.cardDate, p.head)}>{format(parseISO(event.date), shortDayMonthPattern(language), { locale: dateLocale })}</div>
                  <div className={cn('card-meta', p.muted)}>{event.time}</div>
                  {(() => {
                    const days = differenceInDays(parseISO(event.date), new Date());
                    const hours = differenceInHours(parseISO(event.date), new Date());
                    if (days <= 0 && hours > 0) {
                      return (
                        <span className={cn('card-meta font-semibold mt-0.5 inline-block', p.isDark ? 'text-orange-300' : 'text-orange-700')}>
                          {t('σε', 'in')} {hours}h
                        </span>
                      );
                    }
                    if (days > 0 && days <= 7) {
                      return (
                        <span className={cn('card-meta font-semibold mt-0.5 inline-block', p.statVal)}>
                          {t('σε', 'in')} {days} {t('μέρες', 'days')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
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

              {group && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {memberUsers.map((user) => (
                      <PersonAvatar key={user!.id} user={user!} size="sm" className="h-6 w-6 border-2 border-white" />
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
                  className="mb-1 inline-flex btn-gradient !py-1.5 min-h-8 items-center justify-center gap-1.5 self-start"
                >
                  <PartyPopper className="h-3.5 w-3.5" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
                  {group.status === 'confirmed' ? t(' · έτοιμη', ' · ready') : ''}
                </button>
              )}

              <div className={cn('mt-auto pt-3.5 border-t flex flex-wrap items-center gap-2', p.borderT)}>
                <button
                  onClick={() => group && navigate(`/chat/${group.id}`)}
                  disabled={!group}
                  className={cn(secondaryBtn, 'flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> {t('Chat', 'Chat')}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(event.id)}
                  className={cn(
                    'px-3 py-1.5 min-h-8 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 border',
                    p.isDark ? 'border-red-500/30 hover:bg-red-500/10 text-red-400' : 'border-red-200 hover:bg-red-50 text-red-700',
                  )}
                >
                  <XCircle className="h-3.5 w-3.5" /> {t('Αποχώρηση', 'Leave')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                  className={cn('text-xs font-bold underline underline-offset-2', p.muted)}
                >
                  {t('Λεπτομέρειες', 'Details')}
                </button>
              </div>
            </div>
          </Card>
          );
        })}

        {upcomingEvents.length === 0 && (
          <EmptyState
            icon={Compass}
            title={t(`Δεν υπάρχουν επερχόμενα σχέδια.`, `No upcoming confirmed plans.`)}
            description={t('Εξερευνήστε εκδηλώσεις και μπείτε σε μια ομάδα για να ξεκινήσετε.', 'Explore experiences and join a group to get started.')}
            actionLabel={t(`Εξερεύνηση`, `Explore Experiences`)}
            onAction={() => navigate('/')}
            secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
            onSecondary={() => navigate('/buddy-seek')}
            askAi
            askPrompt={t(
              'Βρες μου κάτι για αυτό το Σαββατοκύριακο με ανοιχτές θέσεις.',
              'Find me something this weekend with open spots.',
            )}
            className="py-8"
          />
        )}
      </div>
      )}

      {activeTab === 'pending' && (
      <div className="space-y-4">
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
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 opacity-80 hover:opacity-100 transition-all duration-200 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative grayscale">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-gray-800/90 text-white px-2 py-0.5 rounded-lg text-2xs font-bold tracking-wide">
                {t(`Εκκρεμής Ομάδα`, `Pending Group`)}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className={cn(PLANS_TYPO.cardTitle, p.head)}>{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className={cn(PLANS_TYPO.cardDate, p.head)}>{format(parseISO(event.date), shortDayMonthPattern(language), { locale: dateLocale })}</div>
                </div>
              </div>

              <p className={cn('card-copy-sm font-medium mb-4', p.sub)}>
                {needed === 1
                  ? t(
                      'Εκδηλώσατε ενδιαφέρον. Αναμονή για 1 ακόμα άτομο για να επιβεβαιωθεί η ομάδα.',
                      'You expressed interest. Waiting for 1 more person to confirm the group and unlock the meeting point.',
                    )
                  : t(
                      `Εκδηλώσατε ενδιαφέρον. Αναμονή για ${needed} ακόμα άτομα για να επιβεβαιωθεί η ομάδα.`,
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
          </Card>
          );
        })}

        {pendingEvents.length === 0 && (
          <EmptyState
            icon={Clock}
            title={t('Καμία εκκρεμής ομάδα.', 'No pending groups.')}
            description={t('Όταν εκδηλώσετε ενδιαφέρον για μια εκδήλωση, θα εμφανιστεί εδώ μέχρι να επιβεβαιωθεί η ομάδα.', 'When you express interest in an event, it appears here until the group is confirmed.')}
            actionLabel={t('Ανακάλυψη', 'Discover')}
            onAction={() => navigate('/')}
            askAi
            askPrompt={t(
              'Δείξε μου ομάδες που σχηματίζονται κοντά μου.',
              'Show me groups forming near me.',
            )}
            className="py-8"
          />
        )}
      </div>
      )}

      {activeTab === 'past' && (
      <div className="space-y-4">
        {needsRating > 0 && (
          <div className={cn('text-xs font-semibold flex items-center gap-1.5', p.muted)}>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            {t(`${needsRating} εκδηλώσεις περιμένουν την αξιολόγησή σας`, `${needsRating} event(s) awaiting your feedback`)}
          </div>
        )}
        {pastEvents.map((event) => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <div className={cn('flex items-center gap-2 mb-1.5 text-xs font-bold', p.muted)}>
                <Calendar className="w-3.5 h-3.5" />
                {format(parseISO(event.date), 'PPP', { locale: dateLocale })}
              </div>
              <h3 className={cn(PLANS_TYPO.cardTitle, 'mb-3', p.head)}>{event.title}</h3>

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
          </Card>
        ))}

        {pastEvents.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title={t('Κανένα ολοκληρωμένο σχέδιο ακόμα.', 'No completed plans yet.')}
            description={t('Οι εκδηλώσεις που παρακολουθήσατε θα εμφανίζονται εδώ για αξιολόγηση και ιστορικό.', 'Events you attend will appear here for ratings and history.')}
            actionLabel={t('Εξερεύνηση', 'Explore')}
            onAction={() => navigate('/')}
            secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
            onSecondary={() => navigate('/buddy-seek')}
            askAi
            className="py-8"
          />
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
          {t('Είστε σίγουροι ότι θέλετε να αποχωρήσετε; Μπορεί να μην μπορέσετε να ξαναμπείτε.', 'Are you sure you want to leave? You might not be able to rejoin.')}
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
              toast.info(t('Αποχωρήσατε από την ομάδα.', 'You have left the group.'), {
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
            {t('Ναι, Αποχώρηση', 'Yes, Leave')}
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

