import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Shield, Settings, Plus, X, Info } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { PlansFormingCard, PlansFormingGroupCard } from './PlansFormingCard';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import { CreateCompanyRequestModal } from './CreateCompanyRequestModal';
import { PlansFormingSkeleton } from './PlansFormingSkeleton';
import {
  PlansFormingEmptyState,
  PlansFormingSectionTitle,
  PlansFormingStatsBar,
  PlansFormingValueHero,
  PlansFormingYourPlanBanner,
} from './plansForming/PlansFormingShared';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import type { Event } from '../../types';
import type { PlansFormingEnrichedItem } from '../../lib/plansFormingUtils';
import type { CompanyJoinRequestStatus } from '../../types/companyRequest';

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

export default function BuddySeekPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const navigate = useNavigate();
  const feed = usePlansFormingFeed(24);
  const sendJoin = useStore((s) => s.sendCompanyJoinRequest);
  const dismiss = useStore((s) => s.dismissCompanyRequest);
  const undismiss = useStore((s) => s.undismissCompanyRequest);
  const acceptJoin = useStore((s) => s.acceptCompanyJoinRequest);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);
  const companyRequests = useStore((s) => s.companyRequests);
  const events = useStore((s) => s.events);
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [preview, setPreview] = useState<PlansFormingEnrichedItem | null>(null);
  const [previewJoinId, setPreviewJoinId] = useState<string | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [createEvent, setCreateEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplainer, setShowExplainer] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem(EXPLAINER_KEY),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissExplainer = () => {
    localStorage.setItem(EXPLAINER_KEY, '1');
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

  if (isLoading) {
    return (
      <div className="w-full max-w-full min-w-0 space-y-6 pb-16 pt-6">
        <PlansFormingSkeleton count={3} variant="inline" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-16 pt-6">
      <header className="space-y-3">
        <h1 className={cn('text-2xl font-bold', a.head)}>{t('Σχέδια που σχηματίζονται', 'Plans forming')}</h1>
        <PlansFormingValueHero insights={feed.insights} />
        <PlansFormingStatsBar insights={feed.insights} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
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
        </div>
      </header>

      {showExplainer && (
        <div className={cn('rounded-2xl border p-4 flex gap-3', a.cardSurface, 'border-cyan-200 bg-cyan-50/60 dark:bg-cyan-950/20 dark:border-cyan-800')}>
          <Info className="w-5 h-5 shrink-0 text-cyan-600 dark:text-cyan-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-bold', a.head)}>
              {t('Τι είναι τα Σχέδια που σχηματίζονται;', 'What are Plans forming?')}
            </p>
            <p className={cn('text-sm font-medium mt-1 leading-relaxed', a.sub)}>
              {t(
                'Δηλώνετε ότι ψάχνετε παρέα για μια εκδήλωση — με έλεγχο ορατότητας. Άλλοι χρήστες μπορούν να σας στείλουν αίτημα ή να ενωθούν σε ομάδα.',
                'You signal you want company for an event — with privacy controls. Others can send join requests or form a group with you.',
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissExplainer}
            className={cn('p-1.5 rounded-lg shrink-0', a.muted, 'hover:bg-black/5 dark:hover:bg-white/10')}
            aria-label={t('Κλείσιμο', 'Dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feed.myActivePlan && (
        <PlansFormingYourPlanBanner
          plan={feed.myActivePlan}
          onManage={() => navigate(`/events/${feed.myActivePlan!.event.id}`)}
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
                className="w-full text-left rounded-xl border border-amber-200 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm font-medium hover:shadow-sm"
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
                'text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors inline-flex items-center gap-1',
                filter === key ? 'bg-cyan-600 text-white border-cyan-600' : a.borderB,
              )}
            >
              {t(el, en)}
              {count != null && count > 0 && (
                <span className={cn('text-xs px-1 rounded-md', filter === key ? 'bg-white/20' : 'bg-cyan-100 text-cyan-800')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && feed.recruitingGroupItems.length === 0 ? (
        <PlansFormingEmptyState suggestedEvent={feed.suggestedEvent} />
      ) : (
        <>
          {filtered.length > 0 && (
            <section className="space-y-3">
              <PlansFormingSectionTitle
                title={t('Αιτήματα παρέας', 'Company requests')}
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

      <p className={cn('text-xs flex items-start gap-2', a.sub)}>
        <Shield className="w-4 h-4 shrink-0" />
        {t(
          'Λεπτομερής ορατότητα · σχεδιασμένο με έλεγχο απορρήτου. Τα ενδιαφέροντα χρησιμοποιούνται για σχετικότητα, όχι για δημόσια έκθεση.',
          'Granular visibility · designed with privacy controls. Interests are used for relevance, not public exposure.',
        )}
      </p>

      {eventPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay"
          onClick={() => setEventPickerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-picker-title"
            className={cn('modal-panel w-full max-w-md max-h-[70vh] overflow-y-auto p-4 rounded-2xl', a.cardSurface)}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="event-picker-title" className={cn('text-lg font-bold mb-3', a.head)}>
              {t('Επιλέξτε εκδήλωση', 'Choose an event')}
            </h2>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setCreateEvent(event);
                    setEventPickerOpen(false);
                  }}
                  className={cn(
                    'w-full text-left rounded-xl border px-3 py-2.5 text-sm font-medium hover:border-cyan-400 transition-colors',
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
              className={cn('w-full mt-3 py-2.5 rounded-xl text-sm font-bold border', a.borderB, a.sub)}
            >
              {t('Ακύρωση', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {createEvent && (
        <CreateCompanyRequestModal
          event={createEvent}
          open
          onClose={() => setCreateEvent(null)}
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
            toast.success(t('Αίτημα εστάλη', 'Request sent'));
          }}
          onAccept={() => {
            if (!previewJoinId) return;
            const groupId = acceptJoin(previewJoinId);
            if (groupId) {
              toast.success(t('Αποδεχτήκατε — άνοιγμα chat', 'Accepted — opening chat'));
              navigate(`/chat/${groupId}`);
            }
          }}
        />
      )}
    </div>
  );
}
