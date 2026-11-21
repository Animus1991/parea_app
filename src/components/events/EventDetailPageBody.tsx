import { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '../../store';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Users, Ticket, ShieldCheck, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { toast } from 'sonner';
import { navigateBack } from '../../lib/smartBackNavigation';
import { useEventDetailActions } from '../../hooks/useEventDetailActions';
import { useEventWaitlist } from '../../hooks/useEventWaitlist';
import { EventDetailActionBar } from './EventDetailActionBar';
import { EventDetailGroupCard } from './EventDetailGroupCard';
import { EventMap } from './EventMap';
import type { EventDetailMapAccent } from './EventMap';
import { EventDetailAboutSection } from './EventDetailAboutSection';
import { EventDetailOrganizerSection } from './EventDetailOrganizerSection';
import { EventDetailReliabilityNote } from './EventDetailReliabilityNote';
import { EventDetailAdventureSection } from './EventDetailAdventureSection';
import { EventDetailSafetySection } from './EventDetailSafetySection';
import { EventDetailMetaSection } from './EventDetailMetaSection';
import { EventDetailQrModal } from './EventDetailQrModal';
import EventDetailPageContent from './EventDetailPageContent';
import { LookingForCompanyPanel } from '../buddySeek/LookingForCompanyPanel';
import { AppSelect } from '../common/AppSelect';
import { computeMatchScore } from '../../lib/matching';
import { NakamasGoing } from '../outings/NakamasGoing';
import { HikeRouteCard } from '../outings/HikeRouteCard';
import { isDarkTheme } from '../../lib/themes';
import { cn } from '../../lib/utils';
import { APP_TYPO } from '../../lib/typographyTokens';
import { EventCoverImg } from '../common/EventCoverImg';
import { useCategoryLabel } from '../../hooks/useCategoryLabel';
import { isLiveCatalogEvent } from '../../lib/eventDisplay';
import { formatEur } from '../../lib/money';

const ShareToWallModal = lazy(() => import('../wall/ShareToWallModal'));

interface EventDetailPageBodyProps {
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
}

/**
 * Canonical EventDetail page — ONE implementation for all 7 theme variants.
 * Chrome colors come from semantic tokens (surface/border/ink/accent ramps) that
 * adapt per [data-theme]; `accent` + `darkSurface` are forwarded to child sections
 * that still keep per-theme token maps.
 */
export default function EventDetailPageBody({ accent, darkSurface = false }: EventDetailPageBodyProps) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const theme = useStore((s) => s.theme);
  const panelDark = darkSurface || isDarkTheme(theme);
  const [groupSizeFilter, setGroupSizeFilter] = useState<'All' | '3' | '4' | '5' | '6+'>('All');
  const [discountFilter, setDiscountFilter] = useState(false);
  const [shareWallOpen, setShareWallOpen] = useState(false);

  const events = useStore((state) => state.events);
  const groups = useStore((state) => state.groups);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const canJoinEvent = useStore((state) => state.canJoinEvent);
  const getPendingFeedbackEventId = useStore((state) => state.getPendingFeedbackEventId);

  const event = events.find(e => e.id === eventId);

  let eventGroups = groups
    .filter(g => g.eventId === eventId)
    .sort((a, b) => {
      if (event?.isPaid && event?.groupDiscount) {
         if (a.discountUnlocked && !b.discountUnlocked) return -1;
         if (!a.discountUnlocked && b.discountUnlocked) return 1;
      }
      const aSpotsLeft = a.targetSize - a.members.length;
      const bSpotsLeft = b.targetSize - b.members.length;
      return aSpotsLeft - bSpotsLeft;
    });

  const totalMembers = eventGroups.reduce((acc, g) => acc + g.members.length, 0);
  const spotsLeftEvent = (event?.maxParticipants || 100) - totalMembers;
  const myGroupForEvent =
    currentUser &&
    groups.find(
      (g) =>
        g.eventId === eventId &&
        g.status !== 'cancelled' &&
        (g.members.includes(currentUser.id) || g.waitlist?.includes(currentUser.id)),
    );

  if (discountFilter) {
    eventGroups = eventGroups.filter(g => g.discountUnlocked);
  }
  if (groupSizeFilter !== 'All') {
    if (groupSizeFilter === '6+') {
      eventGroups = eventGroups.filter(g => g.targetSize >= 6);
    } else {
      eventGroups = eventGroups.filter(g => g.targetSize === parseInt(groupSizeFilter));
    }
  }

  const organizer = event ? users.find(u => u.id === event.organizerId) : null;

  const {
    isSaved,
    handleSave,
    showQRCode,
    setShowQRCode,
    isCopied,
    handleShare,
    handleAddToGoogleCalendar,
    handleDownloadIcs,
    calendarAvailability,
  } = useEventDetailActions(eventId, event);

  const { isWaitlisted, handleJoinWaitlist } = useEventWaitlist(eventId ?? '');

  const handlePrimaryJoin = () => {
    if (!eventId) return;
    const gate = canJoinEvent(eventId);
    if (!gate.ok) {
      toast.error(t(gate.messageEl, gate.messageEn));
      if (gate.reason === 'feedback') {
        const pending = getPendingFeedbackEventId();
        if (pending) navigate(`/history/feedback/${pending}`);
      }
      return;
    }
    navigate(`/events/${eventId}/join`);
  };

  if (!event) return <div className="p-5 text-center text-ink-muted font-medium">{t('Η εκδήλωση δεν βρέθηκε', 'Event not found')}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-full space-y-4 pb-24 md:pb-5"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigateBack(navigate)}
            aria-label={t('Επιστροφή στην ανακάλυψη', 'Back to Discover')}
            className="inline-flex items-center gap-1 min-h-8 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <span aria-hidden>&larr;</span> {t('Πίσω', 'Back')}
          </button>

          <EventDetailActionBar
            accent={accent}
            darkSurface={panelDark}
            isSaved={isSaved}
            onSave={handleSave}
            onQr={() => setShowQRCode(true)}
            onShare={handleShare}
            onShareToWall={() => setShareWallOpen(true)}
            isCopied={isCopied}
            onAddToGoogleCalendar={handleAddToGoogleCalendar}
            onDownloadIcs={handleDownloadIcs}
            calendarAvailability={calendarAvailability}
          />
        </div>

        <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden shadow-soft-md">
          <motion.div layoutId={`event-image-${event.id}`} className="h-full w-full">
            <EventCoverImg event={event} className="w-full h-full object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="neutral">{categoryLabel(event.category)}</Badge>
          {event.isPaid ? (
            <Badge variant="outline" icon={<Ticket className="h-3 w-3" />}>{formatEur(event.price, language)}</Badge>
          ) : (
            <Badge variant="outline">{t('Δωρεάν', 'Free')}</Badge>
          )}
          {event.groupDiscount && (
             <Badge variant="outline" icon={<CheckCircle className="h-3 w-3" />}>
               -{event.groupDiscount.percentage}% {t('έκπτωση για', 'off for')} {event.groupDiscount.minSize}+ {t('άτομα', 'people')}
             </Badge>
          )}
          {event.minTrustTierAccess === '3_high_trust' && (
            <Badge variant="outline" icon={<ShieldCheck className="h-3 w-3" />}>{t('Πρόσβαση με επαλήθευση', 'Verified Access')}</Badge>
          )}

          {/* Match score: the same formula as the event card, and the only coloured chip here. */}
          {currentUser && event.tags && event.tags.length > 0 && (
            <Badge variant="outline" className="text-accent-strong font-bold bg-accent-soft border-accent/20">
              {computeMatchScore(currentUser, event)}% {t('Ταίριασμα', 'Match')}
            </Badge>
          )}
        </div>
        <h1 className={cn(APP_TYPO.pageTitle, 'text-ink mb-2 md:mb-0')}>{event.title}</h1>
        <EventDetailPageContent event={event} accent={accent} darkSurface={panelDark} className="mt-4" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-5 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-4 md:space-y-5 md:col-span-3 lg:col-span-2">
          <section className="nakamas-card space-y-4 text-ink leading-relaxed bg-surface-raised rounded-2xl border border-border p-5 md:p-4 shadow-soft">
             <EventDetailMetaSection event={event} accent={accent} darkSurface={panelDark} />
             <EventMap event={event} accent={accent} darkSurface={panelDark} />
             <EventDetailAboutSection event={event} accent={accent} darkSurface={panelDark} />
             <EventDetailOrganizerSection organizer={organizer} accent={accent} darkSurface={panelDark} />
             <EventDetailSafetySection event={event} accent={accent} darkSurface={panelDark} />
             <EventDetailAdventureSection event={event} accent={accent} darkSurface={panelDark} />
          </section>
          {/* Φ27 — hiking route: numbers for everyone, start point for confirmed members. */}
          {event.route && (
            <HikeRouteCard
              route={event.route}
              revealStart={Boolean(
                currentUser &&
                  groups.some(
                    (g) => g.eventId === event.id && g.members.includes(currentUser.id) && (g.status === 'confirmed' || g.status === 'completed'),
                  ),
              )}
            />
          )}
          <EventDetailReliabilityNote event={event} accent={accent} darkSurface={panelDark} />
        </div>

        {/* Right Column: Groups & Actions */}
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-surface-raised p-4 shadow-soft sticky top-24">
            <NakamasGoing eventId={event.id} className="mb-4" />
            <LookingForCompanyPanel event={event} accent={accent} darkSurface={panelDark} />

            <h3 id="groups" className="scroll-mt-28 text-xs font-bold text-ink-muted tracking-wide mb-4">{t('Ομάδες για αυτή την εκδήλωση', 'Groups for this event')}</h3>
            <div className="mb-4 bg-accent-soft border border-accent/20 rounded-lg p-3 flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-2 text-xs font-bold text-accent-strong">
              <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" /> {t('Συνολική χωρητικότητα εκδήλωσης', 'Overall Event Capacity')}</span>
              <span className="text-accent bg-surface-raised xl:bg-transparent px-2 py-0.5 xl:p-0 rounded-full text-xs border border-accent/20 xl:border-transparent">{Math.max(0, spotsLeftEvent)} {t('θέσεις έμειναν', 'spots left')}</span>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {!isLiveCatalogEvent(event) ? (
                <p className="text-sm font-medium text-ink-muted">
                  {t('Η εκδήλωση ακυρώθηκε.', 'This event was cancelled.')}
                </p>
              ) : myGroupForEvent ? (
                <>
                  <Button
                    className="w-full bg-accent text-accent-fg hover:bg-accent-strong shadow-soft-md flex items-center justify-center gap-2"
                    size="lg"
                    onClick={() => navigate(`/night/${myGroupForEvent.id}`)}
                  >
                    <Users className="w-5 h-5" />
                    {t('Η βραδιά μας', 'Our night')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${eventId}/join`)}
                    className="text-xs font-bold text-ink underline underline-offset-2"
                  >
                    {t('Ή δημιούργησε άλλη ομάδα', 'Or create another group')}
                  </button>
                </>
              ) : (
                <Button className="w-full bg-accent text-accent-fg hover:bg-accent-strong shadow-soft-md flex items-center justify-center gap-2" size="lg" onClick={() => navigate(`/events/${eventId}/join`)}>
                  <Users className="w-5 h-5" />
                  {t('Δημιουργία νέας ομάδας', 'Create New Group')}
                </Button>
              )}
            </div>

            {(eventGroups.length > 0 || groupSizeFilter !== 'All' || discountFilter) && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-2xs font-bold text-ink-muted mt-1.5">{t('Φίλτρο:', 'Filter by:')}</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    <AppSelect
                      ariaLabel={t('Μέγεθος ομάδας', 'Group size')}
                      value={groupSizeFilter}
                      onValueChange={(v) => setGroupSizeFilter(v as typeof groupSizeFilter)}
                      className="filter-select bg-surface border border-border"
                      options={[
                        { value: 'All', label: t('Όλα τα μεγέθη', 'Any Size') },
                        { value: '3', label: t('3 Μέλη', '3 Members') },
                        { value: '4', label: t('4 Μέλη', '4 Members') },
                        { value: '5', label: t('5 Μέλη', '5 Members') },
                        { value: '6+', label: t('6+ Μέλη', '6+ Members') },
                      ]}
                    />
                    {event.isPaid && event.groupDiscount && (
                      <button
                        onClick={() => setDiscountFilter(!discountFilter)}
                        className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${discountFilter ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300' : 'bg-surface border-border text-ink-muted hover:bg-ink/5'}`}
                      >
                        {t('Μόνο με έκπτωση', 'Discount Only')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {eventGroups.length === 0 ? (
              <div className="text-xs text-ink-muted mb-4 bg-surface p-4 rounded-2xl text-center border border-dashed border-border font-medium">
                {t('Δεν υπάρχουν ομάδες ακόμα. Ξεκίνα εσύ την πρώτη!', 'No groups forming yet. Be the first to start one!')}
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {eventGroups.map(group => (
                  <EventDetailGroupCard key={group.id} group={group} event={event} navigate={navigate} accent={accent} darkSurface={panelDark} />
                ))}
              </div>
            )}

            <div className="space-y-4 pt-5 border-t border-border">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full border-border text-ink hover:bg-ink/5" size="lg" disabled={isWaitlisted} onClick={handleJoinWaitlist}>
                  {isWaitlisted ? t('Στη λίστα αναμονής ✓', 'On waitlist ✓') : t('Λίστα αναμονής', 'Join Waitlist')}
                </Button>
              </div>
              <div className="text-2xs text-ink-muted font-medium bg-surface rounded-lg text-center p-3 leading-relaxed tracking-wide">
                {t('Δημιούργησε νέα ομάδα 3-5 ατόμων. ', 'Create a new 3-5 person group. ')}
                {event.isPaid ? (
                  <span className="block mt-1 font-bold text-ink">{t('Η πληρωμή κρατιέται και χρεώνεται όταν επιβεβαιωθεί η ομάδα.', 'Payment is held and charged when the group is confirmed.')}</span>
                ) : (
                  <span className="block mt-1 font-bold">{t('Δωρεάν δημιουργία.', 'Free to start.')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA — primary: Find Nakamas (gated). It sits on top of the
          bottom navigation (it used to cover it, so the nav could not be tapped). */}
      <div className="fixed left-0 right-0 bottom-[calc(var(--bottom-nav-total)+env(safe-area-inset-bottom,0px))] bg-surface-raised/95 backdrop-blur-md border-t border-border p-4 shadow-soft-up md:hidden z-fab flex gap-3">
        <Button variant="outline" className="flex-1 min-h-8 border-border text-ink" onClick={handleSave}>
          {isSaved ? t('Αποθηκευμένο', 'Saved') : t('Αποθήκευση', 'Save')}
        </Button>
        <Button className="flex-[2] min-h-8 bg-accent text-accent-fg hover:bg-accent-strong shadow-soft" onClick={handlePrimaryJoin}>
          {t('Μπες σε παρέα', 'Join a group')}
        </Button>
      </div>

      <EventDetailQrModal open={showQRCode} onClose={() => setShowQRCode(false)} />
      {shareWallOpen && (
        <Suspense fallback={null}>
          <ShareToWallModal eventId={event.id} eventTitle={event.title} open={shareWallOpen} onClose={() => setShareWallOpen(false)} />
        </Suspense>
      )}
    </motion.div>
  );
}
