import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Settings, Plus } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { PlansFormingCard, PlansFormingGroupCard } from './PlansFormingCard';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import { CreateCompanyRequestModal } from './CreateCompanyRequestModal';
import {
  PlansFormingEmptyState,
  PlansFormingSectionTitle,
  PlansFormingStatsBar,
  PlansFormingValueHero,
  PlansFormingYourPlanBanner,
} from './plansForming/PlansFormingShared';
import { PlansFormingSkeleton } from './PlansFormingSkeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { Modal } from '../common/Modal';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { APP_TYPO } from '../../lib/typographyTokens';
import { toast } from 'sonner';
import type { Event } from '../../types';
import type { PlansFormingEnrichedItem } from '../../lib/plansFormingUtils';
import type { CompanyJoinRequestStatus, CompanyRequest } from '../../types/companyRequest';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { MiniOutingsSection } from '../outings/MiniOutingsSection';
import { hasUsualHours, matchesUsualHours } from '../../lib/quietCatalog';

type FilterKey = 'all' | 'open_spots' | 'verified' | 'small_groups' | 'flexible' | 'saved_events' | 'high_match';

function joinStatusLabel(status: CompanyJoinRequestStatus, t: (el: string, en: string) => string) {
  switch (status) {
    case 'pending':
      return t('Εκκρεμές', 'Pending');
    case 'accepted':
      return t('Αποδεκτό', 'Accepted');
    case 'declined':
      return t('Απορρίφθηκε', 'Declined');
    case 'withdrawn':
      return t('Ανακλήθηκε', 'Withdrawn');
    case 'expired':
      return t('Έληξε', 'Expired');
    default:
      return status;
  }
}

type RequestWizard = { event: Event; existing?: CompanyRequest };

export default function BuddySeekPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const feed = usePlansFormingFeed(24);
  const sendJoin = useStore((s) => s.sendCompanyJoinRequest);
  const dismiss = useStore((s) => s.dismissCompanyRequest);
  const undismiss = useStore((s) => s.undismissCompanyRequest);
  const acceptJoin = useStore((s) => s.acceptCompanyJoinRequest);
  const declineJoin = useStore((s) => s.declineCompanyJoinRequest);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);
  const companyRequests = useStore((s) => s.companyRequests);
  const { events, isLoading, isError, refetch } = useEventsResource();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const availability = useStore((s) => s.userSettings.availability);
  const [showQueuedSeeks, setShowQueuedSeeks] = useState(false);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [preview, setPreview] = useState<PlansFormingEnrichedItem | null>(null);
  const [previewJoinId, setPreviewJoinId] = useState<string | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [wizard, setWizard] = useState<RequestWizard | null>(null);
  useEffect(() => {
    const editId = searchParams.get('editRequest');
    if (!editId) return;
    const req = companyRequests.find((r) => r.id === editId);
    const event = req ? events.find((e) => e.id === req.eventId) : undefined;
    if (req && event) setWizard({ event, existing: req });
    const next = new URLSearchParams(searchParams);
    next.delete('editRequest');
    setSearchParams(next, { replace: true });
  }, [searchParams, companyRequests, events, setSearchParams]);

  const upcomingEvents = useMemo(
    () =>
      events.filter((e) => {
        try {
          return new Date(`${e.date}T${e.time || '20:00'}`) > new Date();
        } catch {
          return true;
        }
      }),
    [events],
  );

  const filtered = useMemo(() => {
    return feed.items.filter((item) => {
      if (filter === 'open_spots') return item.intent.openToJoinGroup !== false;
      if (filter === 'verified') return item.intent.requiredTrustTier !== 'none';
      if (filter === 'small_groups') return (item.intent.preferredGroupMax ?? 6) <= 4;
      if (filter === 'flexible') return item.intent.flexibleDates;
      if (filter === 'saved_events') return item.isSavedEvent;
      if (filter === 'high_match') return item.isHighMatch;
      return true;
    });
  }, [feed.items, filter]);

  const splitByHours = hasUsualHours(currentUser, availability);
  const inHoursItems = useMemo(
    () =>
      splitByHours
        ? filtered.filter((item) => matchesUsualHours(item.event, currentUser, availability))
        : filtered,
    [filtered, splitByHours, currentUser, availability],
  );
  const queuedItems = useMemo(
    () =>
      splitByHours
        ? filtered.filter((item) => !matchesUsualHours(item.event, currentUser, availability))
        : [],
    [filtered, splitByHours, currentUser, availability],
  );
  const visibleSeeks = showQueuedSeeks ? [...inHoursItems, ...queuedItems] : inHoursItems;

  const pendingForMe = companyJoinRequests.filter(
    (j) => j.status === 'pending' && j.targetUserId === currentUser?.id,
  );

  const sentByMe = companyJoinRequests.filter((j) => j.fromUserId === currentUser?.id);

  const filterCounts = useMemo(
    () => ({
      all: feed.items.length,
      high_match: feed.items.filter((i) => i.isHighMatch).length,
      saved_events: feed.items.filter((i) => i.isSavedEvent).length,
      flexible: feed.items.filter((i) => i.intent.flexibleDates).length,
      open_spots: feed.items.filter((i) => i.intent.openToJoinGroup !== false).length,
      small_groups: feed.items.filter((i) => (i.intent.preferredGroupMax ?? 6) <= 4).length,
      verified: feed.items.filter((i) => i.intent.requiredTrustTier !== 'none').length,
    }),
    [feed.items],
  );

  usePublishPageSnapshot({
    titleEl: 'Βρες Nakamas',
    titleEn: 'Find Nakamas',
    state: filter,
    summaryEl: `${filtered.length} σχέδια · ${pendingForMe.length} αιτήματα προς εσένα`,
    summaryEn: `${filtered.length} plans · ${pendingForMe.length} requests for you`,
    visibleIds: visibleSeeks.slice(0, 8).map((i) => i.intent.id),
  });

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 pb-16 pt-4">
      <header className="space-y-3">
        <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Βρες Nakamas', 'Find Nakamas')}</h1>
        <PlansFormingValueHero insights={feed.insights} />
        {/* StatsBar omitted when ValueHero already states compatible count — less chrome. */}
        {feed.insights.compatiblePlans === 0 && (
          <PlansFormingStatsBar plain insights={feed.insights} />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings?section=buddy-seek')}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 min-h-8 rounded-xl border',
              a.borderB,
              a.sub,
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            {t('Ρυθμίσεις απορρήτου', 'Privacy settings')}
          </button>
          <button
            type="button"
            onClick={() => setEventPickerOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 min-h-8 rounded-xl border',
              a.borderB,
              a.sub,
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Νέο αίτημα από εκδήλωση', 'New request from event')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/plans')}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 min-h-8 rounded-xl border',
              a.borderB,
              a.sub,
            )}
          >
            {t('Τα σχέδιά μου', 'My plans')}
          </button>
        </div>
      </header>

      {/* Soft one-line vibe nudge — matching uses «Το στυλ παρέας μου»; never blocks browsing. */}
      {currentUser && !currentUser.vibe && (
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className={cn(
            'w-full rounded-xl border border-dashed px-3 py-2 text-left text-xs font-bold transition-colors',
            a.borderB,
            a.head,
            'hover:border-border-strong',
          )}
        >
          {t(
            'Ολοκλήρωσε το στυλ παρέας (5 ερωτήσεις) →',
            'Complete your group style (5 questions) →',
          )}
        </button>
      )}

      {/* Φ27 — small outings without an event (coffee / walk / run) */}
      <MiniOutingsSection />

      {feed.myActivePlan && (
        <PlansFormingYourPlanBanner
          plan={feed.myActivePlan}
          onManage={() => navigate(`/events/${feed.myActivePlan!.event.id}`)}
          onEdit={() =>
            setWizard({
              event: feed.myActivePlan!.event,
              existing: feed.myActivePlan!.intent,
            })
          }
        />
      )}

      {pendingForMe.length > 0 && (
        <section className={cn('rounded-2xl border p-4 space-y-2', a.cardSurface, 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20')}>
          <PlansFormingSectionTitle title={t('Αιτήματα προς έλεγχο', 'Requests to review')} />
          {pendingForMe.map((j) => {
            const from = users.find((u) => u.id === j.fromUserId);
            const plan = feed.items.find((i) => i.intent.id === j.companyRequestId);
            if (!from || !plan) return null;
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => {
                  setPreview(plan);
                  setPreviewJoinId(j.id);
                }}
                className="w-full text-left rounded-xl border border-amber-200 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm font-medium hover:shadow-soft"
              >
                {t('Από', 'From')} <strong>{from.name.split(' ')[0]}</strong> — {plan.event.title}
              </button>
            );
          })}
        </section>
      )}

      {sentByMe.length > 0 && (
        <section className={cn('rounded-2xl border p-4 space-y-2', a.cardSurface, a.borderB)}>
          <PlansFormingSectionTitle title={t('Αιτήματα που έστειλα', 'Requests I sent')} />
          {sentByMe.map((j) => {
            const request = companyRequests.find((r) => r.id === j.companyRequestId);
            const event = request ? events.find((e) => e.id === request.eventId) : null;
            const target = j.targetUserId ? users.find((u) => u.id === j.targetUserId) : null;
            return (
              <div
                key={j.id}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium flex items-center justify-between gap-2',
                  a.borderB,
                )}
              >
                <span className="truncate">
                  {event?.title ?? t('Αίτημα', 'Request')}
                  {target ? ` · ${target.name.split(' ')[0]}` : ''}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-xs font-bold px-2 py-0.5 rounded-full',
                    j.status === 'pending' && 'bg-amber-100 text-amber-800',
                    j.status === 'accepted' && 'bg-emerald-100 text-emerald-800',
                    j.status === 'declined' && 'bg-red-100 text-red-700',
                    (j.status === 'withdrawn' || j.status === 'expired') && 'bg-gray-100 text-gray-600',
                  )}
                >
                  {joinStatusLabel(j.status, t)}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <div className={cn('rounded-2xl border p-3 space-y-3', a.cardSurface, a.borderB)}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 opacity-60" />
          <span className={cn('text-sm font-bold', a.head)}>{t('Φίλτρα', 'Filters')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Όλα', 'All', filterCounts.all],
              ['high_match', 'Υψηλή συμβατότητα', 'High match', filterCounts.high_match],
              ['saved_events', 'Αποθηκευμένες', 'Saved events', filterCounts.saved_events],
              ['flexible', 'Ευέλικτα', 'Flexible', filterCounts.flexible],
              ['open_spots', 'Ανοιχτές θέσεις', 'Open spots', filterCounts.open_spots],
              ['small_groups', 'Μικρές ομάδες', 'Small groups', filterCounts.small_groups],
              ['verified', 'Επαληθευμένοι', 'Verified', filterCounts.verified],
            ] as const
          ).map(([key, el, en, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'filter-chip text-xs font-bold px-3 rounded-xl border transition-colors gap-1',
                filter === key ? 'bg-cyan-600 text-white border-cyan-600' : a.borderB,
              )}
            >
              {t(el, en)}
              {count != null && count > 0 && (
                <span className={cn('text-xs px-1 rounded-lg', filter === key ? 'bg-white/20' : 'bg-cyan-100 text-cyan-800')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={<PlansFormingSkeleton count={3} variant="inline" />}
        errorTitle={t('Αδυναμία φόρτωσης αιτημάτων', 'Could not load requests')}
      >
      {visibleSeeks.length === 0 && queuedItems.length === 0 && feed.recruitingGroupItems.length === 0 ? (
        <PlansFormingEmptyState suggestedEvent={feed.suggestedEvent} />
      ) : (
        <>
          {visibleSeeks.length > 0 && (
            <section className="space-y-4">
              <PlansFormingSectionTitle
                title={t('Αιτήματα Nakamas', 'Nakama requests')}
                subtitle={t(`${visibleSeeks.length} αποτελέσματα`, `${visibleSeeks.length} results`)}
              />
              {visibleSeeks.map((item) => (
                <PlansFormingCard
                  key={item.intent.id}
                  item={item}
                  variant="page"
                  onDismiss={() => {
                    dismiss(item.intent.id);
                    toast(t('Απόκρυψη', 'Hidden'), {
                      action: { label: t('Αναίρεση', 'Undo'), onClick: () => undismiss(item.intent.id) },
                    });
                  }}
                />
              ))}
            </section>
          )}
          {queuedItems.length > 0 && (
            <button
              type="button"
              aria-pressed={showQueuedSeeks}
              onClick={() => setShowQueuedSeeks((v) => !v)}
              className={cn(
                'filter-chip inline-flex h-[1.75rem] items-center self-start rounded-full border px-3 text-xs font-bold leading-none',
                showQueuedSeeks
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border bg-surface-raised text-ink',
              )}
            >
              {showQueuedSeeks
                ? t('Κρύψε άλλες ώρες', 'Hide other times')
                : t(`Άλλες ώρες (${queuedItems.length})`, `Other times (${queuedItems.length})`)}
            </button>
          )}

          {feed.recruitingGroupItems.length > 0 && (
            <section className="space-y-4">
              <PlansFormingSectionTitle title={t('Ομάδες με ανοιχτές θέσεις', 'Groups with open spots')} />
              {feed.recruitingGroupItems.map((entry) => (
                <PlansFormingGroupCard key={entry.group.id} entry={entry} variant="page" />
              ))}
            </section>
          )}
        </>
      )}
      </ResourceStateGate>

      <Modal
        open={eventPickerOpen}
        onClose={() => setEventPickerOpen(false)}
        title={t('Επιλέξτε εκδήλωση', 'Choose an event')}
        size="md"
        className="max-h-[70vh]"
      >
        <div className="space-y-2">
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              data-autofocus={event.id === upcomingEvents[0]?.id ? true : undefined}
              onClick={() => {
                setWizard({ event });
                setEventPickerOpen(false);
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-2.5 text-sm font-medium hover:border-accent transition-colors text-ink',
                a.borderB,
              )}
            >
              <span className={cn('font-bold block', a.head)}>{event.title}</span>
              <span className={cn('text-xs', a.muted)}>{event.date} · {event.locationArea}</span>
            </button>
          ))}
          {upcomingEvents.length === 0 && (
            <p className={cn('text-sm font-medium py-4 text-center', a.muted)}>
              {t('Δεν υπάρχουν επερχόμενες εκδηλώσεις', 'No upcoming events')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEventPickerOpen(false)}
          className={cn('w-full mt-3 py-2.5 rounded-xl text-xs font-bold border', a.borderB, a.sub)}
        >
          {t('Ακύρωση', 'Cancel')}
        </button>
      </Modal>

      {wizard && (
        <CreateCompanyRequestModal
          event={wizard.event}
          existingRequest={wizard.existing}
          open
          onClose={() => setWizard(null)}
        />
      )}

      {preview && (
        <JoinRequestPreviewModal
          open
          onClose={() => {
            setPreview(null);
            setPreviewJoinId(null);
          }}
          seeker={preview.seeker}
          event={preview.event}
          mode={previewJoinId ? 'owner_review' : 'send'}
          onSendRequest={() => {
            sendJoin(preview.intent.id);
            toast.success(t('Αίτημα εστάλη', 'Request sent'), {
              action: {
                label: t('Inbox', 'Inbox'),
                onClick: () => navigate('/inbox'),
              },
            });
          }}
          onAccept={() => {
            if (!previewJoinId) return;
            const groupId = acceptJoin(previewJoinId);
            if (groupId) {
              toast.success(t('Αποδεχτήκατε — άνοιγμα της βραδιάς', 'Accepted — opening Our night'), {
                action: {
                  label: t('Η βραδιά μας', 'Our night'),
                  onClick: () => navigate(`/night/${groupId}`),
                },
              });
              navigate(`/night/${groupId}`);
            }
          }}
          onDecline={() => {
            if (!previewJoinId) return;
            declineJoin(previewJoinId);
            toast.info(t('Το αίτημα απορρίφθηκε', 'Request declined'));
          }}
        />
      )}
    </div>
  );
}
