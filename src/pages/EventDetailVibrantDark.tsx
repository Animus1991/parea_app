import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, EventDetailSkeleton } from '../components/common/Skeleton';
import { Users, Ticket, ShieldCheck, MapPin, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useLanguage } from '../lib/i18n';
import { navigateBack } from '../lib/smartBackNavigation';
import { useEventDetailActions } from '../hooks/useEventDetailActions';
import { useEventWaitlist } from '../hooks/useEventWaitlist';
import { EventDetailActionBar } from '../components/events/EventDetailActionBar';
import { EventDetailGroupCard } from '../components/events/EventDetailGroupCard';
import { EventMap } from '../components/events/EventMap';
import { EventDetailAboutSection } from '../components/events/EventDetailAboutSection';
import { EventDetailOrganizerSection } from '../components/events/EventDetailOrganizerSection';
import { EventDetailReliabilityNote } from '../components/events/EventDetailReliabilityNote';
import { EventDetailAdventureSection } from '../components/events/EventDetailAdventureSection';
import { EventDetailSafetySection } from '../components/events/EventDetailSafetySection';
import { EventDetailMetaSection } from '../components/events/EventDetailMetaSection';
import { EventDetailQrModal } from '../components/events/EventDetailQrModal';
import EventDetailPageContent from '../components/events/EventDetailPageContent';
import { EventDetailBuddySeekPanel } from '../components/buddySeek/EventDetailBuddySeekPanel';

function Group({ group, event, navigate }: { group: import('../types').Group; event: import('../types').Event; navigate: import('react-router-dom').NavigateFunction }) {
  return <EventDetailGroupCard group={group} event={event} navigate={navigate} accent="vibrant" darkSurface />;
}

export default function EventDetailVibrantDark() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [groupSizeFilter, setGroupSizeFilter] = useState<'All' | '3' | '4' | '5' | '6+'>('All');
  const [discountFilter, setDiscountFilter] = useState(false);
  
  const events = useStore((state) => state.events);
  const groups = useStore((state) => state.groups);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [eventId]);

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

  // Safely get API key
  
  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!event) return <div className="p-8 text-center text-white font-medium">{t('Η εκδήλωση δεν βρέθηκε', 'Event not found')}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-full space-y-8 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigateBack(navigate)}
            className="text-[10px] font-bold tracking-wide text-white hover:text-white"
          >
            &larr; {t('Επιστροφή στην Ανακάλυψη', 'Back to Discover')}
          </button>
          
          <EventDetailActionBar
            accent="vibrant"
            darkSurface
            isSaved={isSaved}
            onSave={handleSave}
            onQr={() => setShowQRCode(true)}
            onShare={handleShare}
            isCopied={isCopied}
            onAddToGoogleCalendar={handleAddToGoogleCalendar}
            onDownloadIcs={handleDownloadIcs}
            calendarAvailability={calendarAvailability}
          />
        </div>
        
        <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden shadow-sm">
          <motion.img 
            layoutId={`event-image-${event.id}`}
            referrerPolicy="no-referrer"
            src={event.imageUrl || 'https://picsum.photos/seed/eventdefault/800/600'} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="neutral">{event.category}</Badge>
          {event.isPaid ? (
            <Badge variant="outline" icon={<Ticket className="h-3 w-3" />}>€{event.price}</Badge>
          ) : (
            <Badge variant="outline">{t('Δωρεάν', 'Free')}</Badge>
          )}
          {event.groupDiscount && (
             <Badge variant="success" icon={<CheckCircle className="h-3 w-3" />}>
               -{event.groupDiscount.percentage}% {t('έκπτωση για', 'off for')} {event.groupDiscount.minSize}+ {t('άτομα', 'people')}
             </Badge>
          )}
          {event.minTrustTierAccess === '3_high_trust' && (
            <Badge variant="outline" className="text-fuchsia-400 font-bold bg-fuchsia-900/30 border-fuchsia-800" icon={<ShieldCheck className="h-3 w-3" />}>{t('Πρόσβαση με Επαλήθευση', 'Verified Access')}</Badge>
          )}
          
          {/* Match Score Badge based on User Interests */}
          {currentUser && event.tags && event.tags.length > 0 && (
            <Badge variant="outline" className="bg-orange-50 border-orange-200 text--400 font-bold" icon={<span className="text-[10px]">🔥</span>}>
              {Math.min(98, Math.max(15, Math.round(((currentUser?.interests ?? []).filter(i => (event.tags ?? []).includes(i)).length / (event.tags ?? [1]).length) * 100) + 40))}% {t('Ταίριασμα', 'Match')}
            </Badge>
          )}
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2 md:mb-0">{event.title}</h1>
        <EventDetailPageContent event={event} accent="vibrant" darkSurface className="mt-4" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-5 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-6 md:space-y-8 md:col-span-3 lg:col-span-2">
          <section className="space-y-4 text-[13px] text-white leading-relaxed bg-gray-800 rounded-2xl border border-gray-700 p-5 md:p-6 shadow-soft">
             <EventDetailMetaSection event={event} accent="vibrant" darkSurface />
             <EventMap event={event} accent="vibrant" darkSurface />
             <EventDetailAboutSection event={event} accent="vibrant" darkSurface />
             <EventDetailOrganizerSection organizer={organizer} accent="vibrant" darkSurface />
             <EventDetailSafetySection event={event} accent="vibrant" darkSurface />
             <EventDetailAdventureSection event={event} accent="vibrant" darkSurface />
          </section>
          <EventDetailReliabilityNote event={event} accent="vibrant" darkSurface />
        </div>

        {/* Right Column: Groups & Actions */}
        <div className="space-y-6 md:col-span-2 lg:col-span-1">
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-soft sticky top-24">
            <EventDetailBuddySeekPanel event={event} accent="vibrant" darkSurface />
            <h3 className="text-[11px] font-bold text-white tracking-wide mb-4">{t('Ομάδες για αυτή την εκδήλωση', 'Groups for this event')}</h3>
            <div className="mb-4 bg-fuchsia-900/30 border border-fuchsia-800 rounded-lg p-3 flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-2 text-sm font-bold text-fuchsia-400">
              <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" /> {t('Συνολική Χωρητικότητα Εκδήλωσης', 'Overall Event Capacity')}</span>
              <span className="text-fuchsia-400 xl:text-fuchsia-400 bg-gray-800 xl:bg-transparent px-2 py-0.5 xl:p-0 rounded-full text-xs xl:text-sm border border-fuchsia-800 xl:border-transparent">{Math.max(0, spotsLeftEvent)} {t('θέσεις έμειναν', 'spots left')}</span>
            </div>
            
            <div className="flex flex-col gap-3 mb-6">
              <Button className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-md flex items-center justify-center gap-2" size="lg" onClick={() => navigate(`/events/${eventId}/join`)}>
                <Users className="w-5 h-5" />
                {t('Δημιουργία Νέας Ομάδας', 'Create New Group')}
              </Button>
            </div>
            
            {(eventGroups.length > 0 || groupSizeFilter !== 'All' || discountFilter) && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-white mt-1.5">{t('Φίλτρο:', 'Filter by:')}</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    <select 
                      value={groupSizeFilter} 
                      onChange={(e) => setGroupSizeFilter(e.target.value as any)}
                      className="text-xs bg-gray-800/70 border border-gray-700 rounded p-1 font-medium focus:outline-none focus:ring-1 focus:ring-fuchsia-9500"
                    >
                      <option value="All">{t('Όλα τα Μεγέθη', 'Any Size')}</option>
                      <option value="3">{t('3 Μέλη', '3 Members')}</option>
                      <option value="4">{t('4 Μέλη', '4 Members')}</option>
                      <option value="5">{t('5 Μέλη', '5 Members')}</option>
                      <option value="6+">{t('6+ Μέλη', '6+ Members')}</option>
                    </select>
                    {event.isPaid && event.groupDiscount && (
                      <button 
                        onClick={() => setDiscountFilter(!discountFilter)}
                        className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${discountFilter ? 'bg-fuchsia-900 border-fuchsia-300 text--400' : 'bg-gray-900 border-gray-700 text-white hover:bg-gray-700'}`}
                      >
                        {t('Μόνο με Έκπτωση', 'Discount Only')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-white font-medium mb-4 leading-relaxed">
              {t('Συνιστούμε ανεπιφύλακτα να δημιουργήσετε ή να συμμετάσχετε σε ομάδες 3-5 ατόμων.', 'We highly recommend joining or creating groups of 3-5 users to reduce awkwardness and ensure the event happens safely.')}
            </p>
            
            {eventGroups.length === 0 ? (
              <div className="text-xs text-white mb-6 bg-gray-800/70 p-4 rounded-xl text-center border border-dashed border-gray-700 font-medium">
                {t('Δεν έχουν δημιουργηθεί ομάδες ακόμα. Γίνετε ο πρώτος που θα ξεκινήσει μία!', 'No groups forming yet. Be the first to start one!')}
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {eventGroups.map(group => (
                  <Group key={group.id} group={group} event={event} navigate={navigate} />
                ))}
              </div>
            )}
            
            <div className="space-y-4 pt-5 border-t border-gray-700">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-700/60" size="lg" disabled={isWaitlisted} onClick={handleJoinWaitlist}>
                  {isWaitlisted ? t('Στη λίστα αναμονής ✓', 'On waitlist ✓') : t('Λίστα Αναμονής', 'Join Waitlist')}
                </Button>
              </div>
              <div className="text-[10px] text-white font-medium bg-gray-800/70 rounded text-center p-3 leading-relaxed tracking-wide">
                {t('Δημιουργήστε νέα ομάδα 3-5 ατόμων. ', 'Create a new 3-5 person group. ')}
                {event.isPaid ? (
                  <span className="block mt-1 font-bold text-white">{t('Η πληρωμή προεγκρίνεται. Χρεώνεται μόνο κατά την επιβεβαίωση.', 'Payment pre-authorized via official partner APIs. Discharges automatically on Group confirmation.')}</span>
                ) : (
                  <span className="block mt-1 font-bold">{t('Δωρεάν δημιουργία.', 'Free to start.')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden z-50 flex gap-3">
        <Button variant="outline" className="flex-1 border-gray-700 text-white" onClick={() => navigate(`/events/${eventId}/join`)}>
          {t('Λίστα Αναμονής', 'Waitlist')}
        </Button>
        <Button className="flex-[2] bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" onClick={() => navigate(`/events/${eventId}/join`)}>
          {t('Νέα Ομάδα', 'Create Group')}
        </Button>
      </div>

      <EventDetailQrModal open={showQRCode} onClose={() => setShowQRCode(false)} />
    </motion.div>
  );
}
