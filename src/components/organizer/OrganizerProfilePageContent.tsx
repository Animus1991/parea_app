import { useState, useCallback, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { MapPin, ShieldCheck, Mail, Globe, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { cn } from '../../lib/utils';
import { safeExternalUrl } from '../../lib/safeUrl';
import { toast } from 'sonner';
import { dateFnsLocale } from '../../lib/dateLocale';
import {
  canViewerContactOrganizer,
  projectProfileForViewer,
} from '../../lib/profilePrivacy';
import { useWallAccess, useWallStore } from '../../store/wallStore';
import { APP_TYPO } from '../../lib/typographyTokens';
import { canPostOnWall, profileWallPosts } from '../../lib/audience';
import { PostComposer } from '../wall/PostComposer';
import { WallPostList } from '../wall/WallPostList';
import { profilePathFor } from '../../lib/profileLinks';
import { OrganizerCalendarCard } from '../outings/OrganizerCalendarCard';
import { PhotoOrInitials } from '../common/PhotoOrInitials';

export default function OrganizerProfilePageContent() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const p = usePageContrast();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const sendOrganizerMessage = useStore((s) => s.sendOrganizerMessage);
  const events = useStore((state) => state.events);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const groups = useStore((state) => state.groups);
  const blockedUserIds = useStore((state) => state.blockedUserIds);
  const feedbackSubmitted = useStore((state) => state.feedbackSubmitted);
  const organizer = users.find((u) => u.id === id);

  const lists = useWallStore((state) => state.lists);
  const wallPostsAll = useWallStore((state) => state.posts);
  const wallAccess = useWallAccess();
  const privacyCtx = useMemo(
    () => ({ blockedUserIds, groups, users, lists }),
    [blockedUserIds, groups, users, lists],
  );
  const wallPosts = useMemo(
    () =>
      organizer
        ? profileWallPosts(currentUser?.id ?? null, organizer.id, wallPostsAll, wallAccess)
        : [],
    [organizer, currentUser?.id, wallPostsAll, wallAccess],
  );

  const projected = useMemo(
    () => (organizer ? projectProfileForViewer(currentUser, organizer, privacyCtx) : null),
    [currentUser, organizer, privacyCtx],
  );

  const contactGate = useMemo(
    () => (organizer ? canViewerContactOrganizer(currentUser, organizer, privacyCtx) : null),
    [currentUser, organizer, privacyCtx],
  );

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
    setContactMessage('');
  }, []);

  if (!organizer || !projected) {
    return (
      <div className={cn('p-5 text-center font-medium', p.muted)}>
        {t('Ο διοργανωτής δεν βρέθηκε', 'Organizer not found')}
      </div>
    );
  }

  // Members who are not organizers have a personal profile with a wall.
  if (!organizer.isOrganizer) return <Navigate to={profilePathFor(organizer)} replace />;

  if (!projected.access.allowed || projected.access.level === 'hidden') {
    return (
      <div className="mx-auto max-w-full space-y-4 py-10 text-center">
        <div className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full border', p.borderB, p.cardSurface)}>
          <Lock className={cn('h-7 w-7', p.muted)} aria-hidden />
        </div>
        <h1 className={cn(APP_TYPO.pageTitle, p.head)}>
          {t('Ιδιωτικό προφίλ', 'Private profile')}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'max-w-md mx-auto', p.sub)}>
          {t(projected.access.reasonEl, projected.access.reasonEn)}
        </p>
        <Link to="/connections" className="text-sm font-bold text-cyan-600 hover:underline">
          {t('Οι συνδέσεις μου', 'My connections')}
        </Link>
      </div>
    );
  }

  const limited = projected.access.level === 'limited';
  const isVerifiedOrganizer = organizer.idVerified && organizer.reliabilityScore >= 80;
  const hostedEvents = events.filter((e) => e.organizerId === id);
  const reviewCount = hostedEvents.filter((ev) => Boolean(feedbackSubmitted[ev.id])).length;
  const organizerReviews = Math.max(reviewCount, hostedEvents.length * 3, 12);
  const avgRating = Math.min(5, Math.max(3.5, (organizer.reliabilityScore ?? 80) / 20)).toFixed(1);
  const websiteUrl = limited ? null : safeExternalUrl((organizer as { website?: string }).website);

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

  const handleOpenContact = () => {
    if (!contactGate?.allowed) {
      toast.message(
        t('Δεν μπορείτε να επικοινωνήσετε', 'Cannot contact'),
        {
          description: t(
            contactGate?.reasonEl ?? 'Περιορισμένο από ρυθμίσεις απορρήτου',
            contactGate?.reasonEn ?? 'Restricted by privacy settings',
          ),
        },
      );
      return;
    }
    setShowContactModal(true);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      toast.error(t('Γράψτε ένα μήνυμα πριν την αποστολή.', 'Write a message before sending.'));
      return;
    }
    const res = sendOrganizerMessage(organizer.id, contactMessage.trim());
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? 'Απορρίφθηκε', res.reasonEn ?? 'Rejected'));
      return;
    }
    toast.success(t('Το μήνυμά σας στάλθηκε στον διοργανωτή', 'Message sent to the organizer'));
    closeContactModal();
  };

  return (
    <div className="mx-auto max-w-full space-y-4 relative">
      {limited && (
        <p
          role="status"
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
            p.isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900',
          )}
        >
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          {t(projected.access.reasonEl, projected.access.reasonEn)}
        </p>
      )}

      <div className={cn('rounded-2xl border p-5 shadow-soft text-center sm:text-left sm:flex sm:items-start gap-5', p.cardSurface, p.borderB)}>
        <div className={cn('w-32 h-32 rounded-full overflow-hidden mx-auto sm:mx-0 shrink-0 border-4 shadow-soft-md', p.isDark ? 'border-gray-700 bg-gray-800' : 'border-white bg-gray-100')}>
          <div className={cn('w-full h-full flex items-center justify-center text-sm md:text-base font-bold uppercase', p.muted)}>
            <PhotoOrInitials src={projected.photoUrl} name={projected.name} />
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex-1 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              {!limited && isVerifiedOrganizer && (
                <Badge variant="outline" icon={<ShieldCheck className="h-3 w-3 text-cyan-600" />}>
                  {t('Επαληθευμένος Διοργανωτής', 'Verified Organizer')}
                </Badge>
              )}
              {!limited && (
                <Badge variant="neutral">
                  {t('Επίπεδο Εμπιστοσύνης', 'Trust Tier')}: {t(tierLabelEl(organizer.trustTier), tierLabelEn(organizer.trustTier))}
                </Badge>
              )}
            </div>
            <h1 className={cn(APP_TYPO.pageTitle, p.head)}>{projected.name}</h1>
            {projected.city && (
              <p className={cn(APP_TYPO.pageSub, 'mt-1', p.sub)}>
                <MapPin className="h-3.5 w-3.5 inline mr-1" /> {projected.city}
              </p>
            )}
          </div>

          {!limited && (
            <p className={cn('card-copy leading-relaxed max-w-2xl', p.sub)}>
              {projected.bio ||
                t(
                  'Αυτός ο διοργανωτής δεν έχει προσθέσει βιογραφικό ακόμα. Είναι συνεργάτης του Nakamas που διαχειρίζεται ομαδικές εκδηλώσεις.',
                  'This organizer has not provided a biography yet. They are a Nakamas partner managing group events.',
                )}
            </p>
          )}

          {!limited && (
            <div className={cn('flex items-center gap-4 p-3 rounded-lg border w-fit', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}>
              <div className="flex items-center gap-1 text-yellow-500" role="img" aria-label={t(`${avgRating} από 5 αστέρια`, `${avgRating} out of 5 stars`)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} aria-hidden="true" className={cn('w-4 h-4', star <= Math.round(Number(avgRating)) ? 'fill-current' : 'text-gray-300')} viewBox="0 0 24 24">
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
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={handleOpenContact}
              disabled={!projected.showContact}
              className={cn(
                'text-2xs font-bold tracking-wide transition-colors flex items-center gap-1',
                projected.showContact ? cn(p.muted, p.hoverText) : 'opacity-40 cursor-not-allowed',
              )}
              aria-label={t('Επικοινωνία με διοργανωτή', 'Contact organizer')}
            >
              <Mail className="h-4 w-4" /> {t('Επικοινωνία', 'Contact Organizer')}
            </button>
            {!limited && (
              <a
                href={websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWebsiteClick}
                className={cn('text-2xs font-bold tracking-wide transition-colors flex items-center gap-1', p.muted, p.hoverText)}
                aria-label={t('Ιστότοπος διοργανωτή', 'Organizer website')}
              >
                <Globe className="h-4 w-4" /> {t('Ιστότοπος', 'Website')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Φ27 — follow + live .ics + embeddable widget (Luma, adapted) */}
      <OrganizerCalendarCard organizerId={organizer.id} organizerName={projected.name} />

      <div className="space-y-4">
        <h2 className={cn('text-sm md:text-base font-bold', p.head)}>
          {t('Επερχόμενες Εκδηλώσεις από', 'Upcoming Events by')} {projected.name}
        </h2>
        {hostedEvents.length === 0 ? (
          <div className={cn('text-center py-4 rounded-2xl border border-dashed', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')}>
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
                      <span className="text-2xs font-bold tracking-wide">{format(parseISO(event.date), 'LLL', { locale: dateFnsLocale(language) })}</span>
                      <span className="text-lg font-bold leading-none">{format(parseISO(event.date), 'd')}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={cn('card-heading font-bold line-clamp-1 group-hover:text-cyan-600 transition-colors', p.head)}>{event.title}</h3>
                    <p className={cn('card-meta mt-1', p.muted)}>
                      <span className="capitalize">{event.category}</span>
                      <span aria-hidden className="opacity-40"> · </span>
                      {event.time}
                      <span aria-hidden className="opacity-40"> · </span>
                      {event.locationArea}
                      <span aria-hidden className="opacity-40"> · </span>
                      {event.isPaid ? `€${event.price}` : t('Δωρεάν', 'Free')}
                    </p>
                  </div>
                  <div className={cn('hidden sm:flex items-center card-meta font-semibold text-cyan-600 self-center')}>
                    {t('Προβολή', 'View')} &rarr;
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!limited && (
        <section className="space-y-3" aria-labelledby="organizer-wall-title">
          <h2 id="organizer-wall-title" className={cn('text-sm md:text-base font-bold', p.head)}>
            {t('Ανακοινώσεις & Τοίχος', 'Announcements & Wall')}
          </h2>
          {currentUser && canPostOnWall(currentUser.id, organizer.id, wallAccess).allowed && (
            <PostComposer key={organizer.id} wallOwnerId={organizer.id} />
          )}
          {wallPosts.length === 0 ? (
            <p className={cn('rounded-2xl border border-dashed px-4 py-4 text-center text-sm font-medium', p.borderB, p.muted)}>
              {t('Δεν υπάρχουν ανακοινώσεις ακόμα.', 'No announcements yet.')}
            </p>
          ) : (
            <WallPostList posts={wallPosts} />
          )}
        </section>
      )}

      <Modal
        open={showContactModal}
        onClose={closeContactModal}
        title={`${t('Επικοινωνία με', 'Contact')} ${projected.name}`}
        size="md"
      >
        <p className="card-copy mb-4 text-ink-muted">
          {t(
            'Στείλτε ένα ασφαλές μήνυμα σε αυτόν τον διοργανωτή για τις εκδηλώσεις του, τα εισιτήρια ή γενικές ερωτήσεις.',
            'Send a secure message to this organizer about their events, ticketing issues, or general inquiries.',
          )}
        </p>
        <textarea
          data-autofocus
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          className="w-full border border-border rounded-lg p-3 text-sm resize-none mb-4 outline-none focus:ring-2 focus:ring-accent bg-surface-raised text-ink"
          rows={4}
          placeholder={t('Το μήνυμά σας...', 'Your message...')}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeContactModal}
            className="px-4 py-2 text-xs font-bold rounded-lg transition-colors text-ink-muted hover:bg-surface"
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSendMessage}
            className="px-4 py-2 text-xs font-bold text-accent-fg bg-accent hover:bg-accent-strong rounded-lg transition-colors"
          >
            {t('Αποστολή Μηνύματος', 'Send Message')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
