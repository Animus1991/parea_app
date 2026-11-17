import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Shield, Settings, Plus, X, Info } from 'lucide-react';
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
import { toast } from 'sonner';
import type { Event } from '../../types';
import type { PlansFormingEnrichedItem } from '../../lib/plansFormingUtils';
import type { CompanyJoinRequestStatus, CompanyRequest } from '../../types/companyRequest';
import { readStorage, writeStorage } from '../../lib/safeUrl';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { MiniOutingsSection } from '../outings/MiniOutingsSection';

type FilterKey = 'all' | 'open_spots' | 'verified' | 'small_groups' | 'flexible' | 'saved_events' | 'high_match';

const EXPLAINER_KEY = 'parea-buddy-seek-explainer-dismissed';

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

  const [filter, setFilter] = useState<FilterKey>('all');
  const [preview, setPreview] = useState<PlansFormingEnrichedItem | null>(null);
  const [previewJoinId, setPreviewJoinId] = useState<string | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [wizard, setWizard] = useState<RequestWizard | null>(null);
  const [showExplainer, setShowExplainer] = useState(
    () => !readStorage(EXPLAINER_KEY),
  );

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

  const dismissExplainer = () => {
    writeStorage(EXPLAINER_KEY, '1');
    setShowExplainer(false);
  };

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
    visibleIds: filtered.slice(0, 8).map((i) => i.intent.id),
  });

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 pb-16 pt-4">
      <header className="space-y-3">
        <h1 className={cn('text-lg md:text-xl font-bold tracking-tight leading-tight', a.head)}>{t('Βρες Nakamas', 'Find Nakamas')}</h1>
        <CopilotInlinePrompt />
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
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border',
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
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border',
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
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border',
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

      {showExplainer && (
        <div className="rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 flex items-center gap-3">
          <Info className="w-4 h-4 shrink-0 text-accent" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink">
              {t('Τι είναι το Βρες Nakamas;', 'What is Find Nakamas?')}
            </p>
            <p className="text-xs font-medium mt-0.5 leading-snug text-ink-muted">
              {t(
                'Δηλώνεις ότι ψάχνεις παρέα για μια εκδήλωση — με πλήρη έλεγχο ορατότητας.',
                'Signal you want company for an event — with full privacy controls.',
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissExplainer}
            className="p-1.5 min-h-8 min-w-8 flex items-center justify-center rounded-lg shrink-0 text-ink-muted hover:bg-surface hover:text-ink"
            aria-label={t('Κλείσιμο', 'Dismiss')}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      )}

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
      {filtered.length === 0 && feed.recruitingGroupItems.length === 0 ? (
        <PlansFormingEmptyState suggestedEvent={feed.suggestedEvent} />
      ) : (
        <>
          {filtered.length > 0 && (
            <section className="space-y-3">
              <PlansFormingSectionTitle
                title={t('Αιτήματα Nakamas', 'Nakama requests')}
                subtitle={t(`${filtered.length} αποτελέσματα`, `${filtered.length} results`)}
              />
              {filtered.map((item) => (
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

          {feed.recruitingGroupItems.length > 0 && (
            <section className="space-y-3">
              <PlansFormingSectionTitle title={t('Ομάδες με ανοιχτές θέσεις', 'Groups with open spots')} />
              {feed.recruitingGroupItems.map((entry) => (
                <PlansFormingGroupCard key={entry.group.id} entry={entry} variant="page" />
              ))}
            </section>
          )}
        </>
      )}
      </ResourceStateGate>

      <p className={cn('text-xs flex items-start gap-2', a.sub)}>
        <Shield className="w-4 h-4 shrink-0" />
        {t(
          'Λεπτομερής ορατότητα · σχεδιασμένο με έλεγχο απορρήτου. Τα ενδιαφέροντα χρησιμοποιούνται για σχετικότητα, όχι για δημόσια έκθεση.',
          'Granular visibility · designed with privacy controls. Interests are used for relevance, not public exposure.',
        )}
      </p>

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
