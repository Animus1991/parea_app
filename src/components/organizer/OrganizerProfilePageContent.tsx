import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Calendar, MapPin, ShieldCheck, Mail, Globe, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export default function OrganizerProfilePageContent() {
  const { id } = useParams();
  const { t } = useLanguage();
  const p = usePageContrast();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const sendOrganizerMessage = useStore((s) => s.sendOrganizerMessage);
  const events = useStore((state) => state.events);
  const users = useStore((state) => state.users);
  const feedbackSubmitted = useStore((state) => state.feedbackSubmitted);
  const organizer = users.find((u) => u.id === id);
  const hostedEvents = events.filter((e) => e.organizerId === id);

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
    setContactMessage('');
  }, []);

  useEffect(() => {
    if (!showContactModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContactModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showContactModal, closeContactModal]);

  if (!organizer) {
    return (
      <div className={cn('p-8 text-center font-medium', p.muted)}>
        {t('Ο διοργανωτής δεν βρέθηκε', 'Organizer not found')}
      </div>
    );
  }

  const isVerifiedOrganizer = organizer.idVerified && organizer.reliabilityScore >= 80;
  const reviewCount = hostedEvents.filter((ev) => Boolean(feedbackSubmitted[ev.id])).length;
  const organizerReviews = Math.max(reviewCount, hostedEvents.length * 3, 12);
  const avgRating = Math.min(5, Math.max(3.5, (organizer.reliabilityScore ?? 80) / 20)).toFixed(1);
  const websiteUrl = (organizer as { website?: string }).website;

  const handleWebsiteClick = (e: React.MouseEvent) => {
    if (!websiteUrl) {
      e.preventDefault();
      toast.info(
        t(
          'Ο διοργανωτής δεν έχει δημοσιεύσει ιστότοπο ακόμα.',
          'This organizer has not published a website yet.',
        ),
      );
    }
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      toast.error(t('Γράψτε ένα μήνυμα πριν την αποστολή.', 'Write a message before sending.'));
      return;
    }
    sendOrganizerMessage(organizer.id, contactMessage.trim());
    toast.success(t('Το μήνυμά σας στάλθηκε στον διοργανωτή', 'Message sent to the organizer'));
    closeContactModal();
  };

  return (
    <div className="mx-auto max-w-full space-y-8 relative pb-20 md:pb-0">
      <div className={cn('rounded-2xl border p-8 shadow-soft text-center sm:text-left sm:flex sm:items-start gap-8', p.cardSurface, p.borderB)}>
        <div className={cn('w-32 h-32 rounded-full overflow-hidden mx-auto sm:mx-0 shrink-0 border-4 shadow-md', p.isDark ? 'border-gray-700 bg-gray-800' : 'border-white bg-gray-100')}>
          {organizer.photoUrl ? (
            <img referrerPolicy="no-referrer" src={organizer.photoUrl} alt={organizer.name} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center text-3xl font-bold', p.muted)}>
              {organizer.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-0 flex-1 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              {isVerifiedOrganizer && (
                <Badge variant="outline" icon={<ShieldCheck className="h-3 w-3 text-cyan-600" />}>
                  {t('Επαληθευμένος Διοργανωτής', 'Verified Organizer')}
                </Badge>
              )}
              <Badge variant="neutral">
                {t('Επίπεδο Εμπιστοσύνης', 'Trust Tier')}: {t(tierLabelEl(organizer.trustTier), tierLabelEn(organizer.trustTier))}
              </Badge>
            </div>
            <h1 className={cn('text-[16px] md:text-[18px] font-bold', p.head)}>{organizer.name}</h1>
            <p className={cn('text-sm font-medium mt-1', p.sub)}>
              <MapPin className="h-3.5 w-3.5 inline mr-1" /> {organizer.city}
            </p>
          </div>

          <p className={cn('text-sm leading-relaxed max-w-2xl', p.sub)}>
            {organizer.bio ||
              t(
                'Αυτός ο διοργανωτής δεν έχει προσθέσει βιογραφικό ακόμα. Είναι συνεργάτης του Nakamas που διαχειρίζεται ομαδικές εκδηλώσεις.',
                'This organizer has not provided a biography yet. They are a Nakamas partner managing group events.',
              )}
          </p>

          <div className={cn('flex items-center gap-4 p-3 rounded-lg border w-fit', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}>
            <div className="flex items-center gap-1 text-yellow-500" aria-label={t(`${avgRating} από 5 αστέρια`, `${avgRating} out of 5 stars`)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={cn('w-4 h-4', star <= Math.round(Number(avgRating)) ? 'fill-current' : 'text-gray-300')} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <div className={cn('text-xs font-bold', p.head)}>
              {avgRating} / 5.0
              <span className={cn('font-medium ml-1', p.muted)}>
                ({t(`${organizerReviews}+ κριτικές εκδηλώσεων`, `${organizerReviews}+ event reviews`)})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className={cn('text-[10px] font-bold tracking-wide transition-colors flex items-center gap-1', p.muted, p.hoverText)}
              aria-label={t('Επικοινωνία με διοργανωτή', 'Contact organizer')}
            >
              <Mail className="h-4 w-4" /> {t('Επικοινωνία', 'Contact Organizer')}
            </button>
            <a
              href={websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className={cn('text-[10px] font-bold tracking-wide transition-colors flex items-center gap-1', p.muted, p.hoverText)}
              aria-label={t('Ιστότοπος διοργανωτή', 'Organizer website')}
            >
              <Globe className="h-4 w-4" /> {t('Ιστότοπος', 'Website')}
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className={cn('text-lg font-bold', p.head)}>
          {t('Επερχόμενες Εκδηλώσεις από', 'Upcoming Events by')} {organizer.name}
        </h2>
        {hostedEvents.length === 0 ? (
          <div className={cn('text-center py-12 rounded-2xl border border-dashed', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')}>
            <p className={cn('font-medium text-sm', p.muted)}>
              {t('Δεν έχουν προγραμματιστεί επερχόμενες εκδηλώσεις.', 'No upcoming events currently scheduled.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hostedEvents.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className={cn('flex items-start gap-4 p-4 transition-colors cursor-pointer group', p.cardHover)}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <div className={cn('w-full h-full flex flex-col items-center justify-center', p.isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700')}>
                      <span className="text-[10px] font-bold tracking-wide">{format(parseISO(event.date), 'MMM')}</span>
                      <span className="text-xl font-bold leading-none">{format(parseISO(event.date), 'd')}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={cn('font-bold line-clamp-1 group-hover:text-cyan-600 transition-colors', p.head)}>{event.title}</h3>
                    <p className={cn('text-xs mt-1', p.muted)}>
                      {event.time} • {event.locationArea}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="neutral">{event.category}</Badge>
                      {event.isPaid ? <Badge variant="outline">€{event.price}</Badge> : <Badge variant="outline">{t('Δωρεάν', 'Free')}</Badge>}
                    </div>
                  </div>
                  <div className={cn('hidden sm:flex items-center text-[10px] font-bold tracking-wide text-cyan-600 self-center')}>
                    {t('Προβολή', 'View')} &rarr;
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="organizer-contact-title"
          onClick={closeContactModal}
        >
          <div
            className={cn('rounded-2xl shadow-xl max-w-md w-full p-6', p.cardSurface)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 id="organizer-contact-title" className={cn('text-lg font-bold', p.head)}>
                {t('Επικοινωνία με', 'Contact')} {organizer.name}
              </h3>
              <button
                type="button"
                onClick={closeContactModal}
                className={cn('transition-colors', p.muted, p.hoverText)}
                aria-label={t('Κλείσιμο', 'Close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className={cn('text-sm mb-4', p.sub)}>
              {t(
                'Στείλτε ένα ασφαλές μήνυμα σε αυτόν τον διοργανωτή για τις εκδηλώσεις του, τα εισιτήρια ή γενικές ερωτήσεις.',
                'Send a secure message to this organizer about their events, ticketing issues, or general inquiries.',
              )}
            </p>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className={cn('w-full border rounded-lg p-3 text-sm resize-none mb-4 outline-none focus:ring-2 focus:ring-cyan-600', p.isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
              rows={4}
              placeholder={t('Το μήνυμά σας...', 'Your message...')}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeContactModal}
                className={cn('px-4 py-2 text-sm font-bold rounded-lg transition-colors', p.muted, p.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
              >
                {t('Ακύρωση', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSendMessage}
                className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
              >
                {t('Αποστολή Μηνύματος', 'Send Message')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
