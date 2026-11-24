import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  EyeOff,
  MapPin,
  Clock,
  Heart,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { countNoun } from '../../lib/plural';
import { useStore } from '../../store';
import { projectRequestForViewer } from '../../lib/companyRequestUtils';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import { formatLocationArea } from '../../lib/eventDisplay';
import { EventCoverImg } from '../common/EventCoverImg';
import { interestLabel } from '../../lib/interests';
import { cn } from '../../lib/utils';
import type { PlansFormingEnrichedItem } from '../../lib/plansFormingUtils';
import type { PlansFormingGroupItem } from '../../hooks/usePlansFormingFeed';
import { CardImageDepthFrame } from '../events/CardImageDepthFrame';
import { GroupProgressBar } from '../events/GroupProgressBar';
import { cardImageDepthFlags, type EventCardImageDepth } from '../../lib/discoverCardImagePreview';

/** Urgency is a quiet chip; only «soon» keeps a colour because it is time-sensitive. */
const URGENCY_TEXT = {
  soon: 'text-amber-800 dark:text-amber-300',
  normal: '',
  flexible: '',
};
const URGENCY_TEXT_DARK = {
  soon: 'text-amber-300',
  normal: '',
  flexible: '',
};

function FactSpread({
  left,
  right,
  leftIcon,
  rightIcon,
  mutedClass = 'text-ink-muted',
}: {
  left?: string | null;
  right?: string | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  mutedClass?: string;
}) {
  if (!left && !right) return null;
  return (
    <div className="flex items-baseline justify-between gap-x-5 gap-y-1">
      {left ? (
        <p className={cn('min-w-0 card-meta font-medium leading-relaxed inline-flex items-center gap-1.5', mutedClass)}>
          {leftIcon}
          <span className="min-w-0">{left}</span>
        </p>
      ) : (
        <span />
      )}
      {right ? (
        <p className={cn('shrink-0 card-meta font-medium leading-relaxed inline-flex items-center gap-1.5', mutedClass)}>
          {rightIcon}
          <span>{right}</span>
        </p>
      ) : null}
    </div>
  );
}

export function PlansFormingCard({
  item,
  variant = 'sidebar',
  isDarkSurface = false,
  onDismiss,
  onNavigate,
  imageDepth = 'full',
}: {
  item: PlansFormingEnrichedItem;
  variant?: 'sidebar' | 'sheet' | 'inline' | 'page';
  isDarkSurface?: boolean;
  onDismiss?: () => void;
  onNavigate?: (path: string) => void;
  imageDepth?: EventCardImageDepth;
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };
  const currentUser = useStore((s) => s.currentUser);
  const prefs = useStore((s) => s.companyRequestPreferences);
  const savedIds = useStore((s) => s.savedCompanyRequestIds);
  const saveRequest = useStore((s) => s.saveCompanyRequest);
  const unsaveRequest = useStore((s) => s.unsaveCompanyRequest);
  const sendJoin = useStore((s) => s.sendCompanyJoinRequest);
  const [previewOpen, setPreviewOpen] = useState(false);

  const projection =
    currentUser && projectRequestForViewer(item.intent, item.seeker, item.event, currentUser, prefs);
  const isSaved = savedIds.includes(item.intent.id);
  const displayName =
    projection?.variant === 'anonymous'
      ? t('Κάποιος με κοινά ενδιαφέροντα', 'Someone with shared interests')
      : projection?.displayName || item.seeker.name.split(' ')[0];

  const isSidebar = variant === 'sidebar';
  const darkCard = isSidebar && isDarkSurface;
  const urgencyText = darkCard ? URGENCY_TEXT_DARK : URGENCY_TEXT;
  const roleText = darkCard ? 'text-cyan-300' : 'text-cyan-700 dark:text-cyan-300';
  const locationLine = item.location ? formatLocationArea(item.location, language) : '';
  const showUrgency = item.urgency.tone !== 'normal';
  const showMatchReason = variant === 'page' && item.matchReason && item.sharedInterestTags.length === 0;
  const interestLine = item.sharedInterestTags.length
    ? item.sharedInterestTags.slice(0, 2).map((tag) => interestLabel(tag, language)).join(' · ')
    : item.sharedInterestCount > 0
      ? t(countNoun(item.sharedInterestCount, 'κοινό', 'κοινά'), `${item.sharedInterestCount} shared`)
      : '';
  const iconBtn =
    'min-h-9 min-w-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors';
  const quietLayout = variant === 'page' || variant === 'sidebar' || variant === 'sheet';
  const compact = variant !== 'page';
  const onDark = compact && isDarkSurface;
  const ink = onDark ? 'text-white' : 'text-ink';
  const muted = onDark ? 'text-gray-400' : 'text-ink-muted';
  const role = onDark ? 'text-cyan-300' : 'text-cyan-700 dark:text-cyan-300';
  const pageIcon = (Icon: typeof Clock) =>
    variant === 'page' ? <Icon className="w-3 h-3 shrink-0 opacity-70" aria-hidden /> : null;
  const depth = imageDepth;
  const flags = cardImageDepthFlags(depth);
  const showPhotoChrome = variant === 'page' || flags.coverTitle;

  if (quietLayout) {
    return (
      <article
        className={cn(
          'nakamas-card isolate overflow-hidden rounded-2xl shadow-soft flex flex-col',
          onDark ? 'bg-white/[0.04]' : 'bg-white dark:bg-gray-900',
        )}
      >
        <CardImageDepthFrame
          event={item.event}
          depth={depth}
          photoHeightClass={variant === 'page' ? 'h-48 md:h-64 lg:h-80' : variant === 'sheet' ? 'h-36' : 'h-48'}
          onPhotoClick={() => go(`/events/${item.event.id}`)}
          photoAriaLabel={t('Δες εκδήλωση', 'View event')}
          top={
            showPhotoChrome ? (
              <div className="absolute top-3 right-3 z-10 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isSaved) unsaveRequest(item.intent.id);
                    else saveRequest(item.intent.id);
                    toast.message(
                      isSaved
                        ? t('Αφαιρέθηκε', 'Removed')
                        : t('Αποθηκεύτηκε ιδιωτικά — δημοσίευσέ το όποτε θέλεις', 'Saved privately — publish anytime'),
                    );
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-gray-700 backdrop-blur-md"
                  aria-label={t('Αποθήκευση σχεδίου', 'Save plan')}
                >
                  <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current text-cyan-700')} />
                </button>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    aria-label={t('Απόκρυψη σχεδίου', 'Hide plan')}
                    title={t('Απόκρυψη', 'Hide')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-gray-700 backdrop-blur-md"
                  >
                    <EyeOff className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
            ) : undefined
          }
          overlay={
            <>
              <p className="card-badge font-semibold tracking-wide text-white/80">
                {t(item.intentLabel.el, item.intentLabel.en)}
                {item.isSavedEvent ? ` · ${t('Αποθηκευμένη', 'Saved')}` : ''}
                {item.isHighMatch ? ` · ${t('Υψηλή συμβατότητα', 'High match')}` : ''}
              </p>
              <div className="space-y-1.5">
                <h3 className="card-heading-lg font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">{item.event.title}</h3>
                {flags.coverOrganizer && (
                  <p className="card-copy leading-relaxed text-white/85">
                    <span className="font-semibold text-white">{displayName}</span>
                    <span className="opacity-50" aria-hidden>{' · '}</span>
                    <span className="card-role font-medium">{t(item.roleLabel.el, item.roleLabel.en)}</span>
                  </p>
                )}
              </div>
              {flags.coverFacts && (
                <div className="space-y-2 text-white/85">
                  <FactSpread mutedClass="text-white/85" leftIcon={pageIcon(Clock)} left={t(item.scheduleFull.el, item.scheduleFull.en)} />
                  <FactSpread
                    mutedClass="text-white/85"
                    leftIcon={pageIcon(MapPin)}
                    left={locationLine}
                    rightIcon={pageIcon(Users)}
                    right={t(item.groupSizeLabel.el, item.groupSizeLabel.en)}
                  />
                </div>
              )}
              {flags.coverFull && (
                <FactSpread
                  mutedClass="text-white/85"
                  left={t(item.meetingLabel.el, item.meetingLabel.en)}
                  rightIcon={!interestLine && showUrgency ? pageIcon(Clock) : null}
                  right={interestLine || (showUrgency ? t(item.urgency.el, item.urgency.en) : null)}
                />
              )}
              {flags.coverRoomy && <div className="min-h-16 flex-1" aria-hidden />}
              {flags.coverFull && item.intent.message && (
                <p className="card-copy leading-relaxed text-white/85">«{item.intent.message}»</p>
              )}
              {flags.coverFull && showMatchReason && item.matchReason && (
                <p className="card-copy leading-relaxed text-white/85">
                  {t(item.matchReason.el, item.matchReason.en)}
                </p>
              )}
              {flags.coverFull && (
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/25 pt-4">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="px-4 min-h-9 rounded-full card-cta bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    {t('Αίτημα συμμετοχής', 'Ask to join')}
                  </button>
                  <button
                    type="button"
                    onClick={() => go(`/events/${item.event.id}`)}
                    className="min-h-9 card-cta text-white/90 transition-colors hover:text-white"
                  >
                    {t('Εκδήλωση', 'Event')}
                  </button>
                </div>
              )}
            </>
          }
        >

        <div className={cn(compact ? 'space-y-3.5 px-4 py-4' : 'space-y-4 px-5 py-5')}>
          <div className="flex items-start justify-between gap-4">
            {!flags.coverTitle && (
            <p className={cn('card-badge font-semibold tracking-wide pt-1', muted)}>
              {t(item.intentLabel.el, item.intentLabel.en)}
              {item.isSavedEvent ? ` · ${t('Αποθηκευμένη', 'Saved')}` : ''}
              {item.isHighMatch ? ` · ${t('Υψηλή συμβατότητα', 'High match')}` : ''}
            </p>
            )}
            <div className={cn('flex shrink-0 -mr-1.5 -mt-1', flags.coverTitle && 'ml-auto')}>
              {variant !== 'page' && !showPhotoChrome && (
              <button
                type="button"
                onClick={() => {
                  if (isSaved) unsaveRequest(item.intent.id);
                  else saveRequest(item.intent.id);
                  toast.message(
                    isSaved
                      ? t('Αφαιρέθηκε', 'Removed')
                      : t('Αποθηκεύτηκε ιδιωτικά — δημοσίευσέ το όποτε θέλεις', 'Saved privately — publish anytime'),
                  );
                }}
                className={cn(iconBtn, onDark && 'text-gray-400 hover:text-white hover:bg-white/5', isSaved && 'text-cyan-700 dark:text-cyan-300')}
                aria-label={t('Αποθήκευση σχεδίου', 'Save plan')}
                title={t('Αποθήκευση σχεδίου', 'Save plan')}
              >
                <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
              </button>
              )}
              {onDismiss && variant !== 'page' && !showPhotoChrome && (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label={t('Απόκρυψη σχεδίου', 'Hide plan')}
                  title={t('Απόκρυψη', 'Hide')}
                  className={cn(iconBtn, onDark && 'text-gray-400 hover:text-white hover:bg-white/5')}
                >
                  <EyeOff className="w-4 h-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {!flags.coverTitle && (
              <h3 className={cn('card-heading-lg font-bold leading-snug', ink)}>{item.event.title}</h3>
            )}
            {!flags.coverOrganizer && (
            <p className={cn('card-copy leading-relaxed', muted)}>
              <span className={cn('font-semibold', ink)}>{displayName}</span>
              <span className="opacity-50" aria-hidden>
                {' · '}
              </span>
              <span className={cn('card-role font-medium', role)}>
                {t(item.roleLabel.el, item.roleLabel.en)}
              </span>
            </p>
            )}
          </div>

          <div className="space-y-2">
            {!flags.coverFacts && (
            <FactSpread
              mutedClass={muted}
              leftIcon={pageIcon(Clock)}
              left={t(item.scheduleFull.el, item.scheduleFull.en)}
            />
            )}
            {!flags.coverFacts && (
            <FactSpread
              mutedClass={muted}
              leftIcon={pageIcon(MapPin)}
              left={locationLine}
              rightIcon={pageIcon(Users)}
              right={t(item.groupSizeLabel.el, item.groupSizeLabel.en)}
            />
            )}
            {!flags.coverFull && (
            <FactSpread
              mutedClass={muted}
              left={t(item.meetingLabel.el, item.meetingLabel.en)}
              rightIcon={!interestLine && showUrgency ? pageIcon(Clock) : null}
              right={interestLine || (showUrgency ? t(item.urgency.el, item.urgency.en) : null)}
            />
            )}
          </div>

          {item.intent.message && (
            <p className={cn('card-copy leading-relaxed', muted)}>«{item.intent.message}»</p>
          )}

          {showMatchReason && item.matchReason && (
            <p className={cn('card-copy leading-relaxed', muted)}>
              {t(item.matchReason.el, item.matchReason.en)}
            </p>
          )}

          {!flags.coverFull && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 min-h-9 rounded-full card-cta bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              {t('Αίτημα συμμετοχής', 'Ask to join')}
            </button>
            <button
              type="button"
              onClick={() => go(`/events/${item.event.id}`)}
              className={cn('min-h-9 card-cta transition-colors', muted, onDark ? 'hover:text-white' : 'hover:text-ink')}
            >
              {t('Εκδήλωση', 'Event')}
            </button>
          </div>
          )}
        </div>
        </CardImageDepthFrame>

        <JoinRequestPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          seeker={item.seeker}
          event={item.event}
          mode="send"
          onSendRequest={() => {
            const id = sendJoin(item.intent.id);
            if (id) toast.success(t('Αίτημα εστάλη — θα ειδοποιηθεί ο/η δημιουργός', 'Request sent — creator notified'));
          }}
        />
      </article>
    );
  }

  return (
    <article
      className={cn(
        'nakamas-card rounded-2xl border transition-colors duration-200 focus-within:ring-2 focus-within:ring-cyan-500/30',
        isSidebar
          ? darkCard
            ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
            : 'bg-white border-gray-200/80 shadow-soft hover:border-gray-300'
          : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-700/80 shadow-soft',
        item.isHighMatch && !isSidebar && 'border-cyan-200/70 dark:border-cyan-500/25',
      )}
    >
      {item.isHighMatch && (
        <p
          className={cn(
            'px-4 pt-3.5 -mb-0.5 flex items-center gap-1 text-xs font-semibold',
            darkCard ? 'text-cyan-300' : 'text-cyan-700 dark:text-cyan-300',
          )}
        >
          <Heart className="w-3 h-3" aria-hidden />
          {t('Υψηλή συμβατότητα', 'High match')}
        </p>
      )}

      {isSidebar && (
        <div className="px-4 pt-3.5 flex items-start gap-1">
          <div className="min-w-0 flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => go(`/events/${item.event.id}`)}
            className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
          >
            <h3 className={cn('card-heading-lg font-bold leading-normal line-clamp-3', darkCard ? 'text-white' : 'text-gray-900')}>
              {item.event.title}
            </h3>
          </button>
          <p className={cn('card-meta-sm font-semibold leading-relaxed', darkCard ? 'text-gray-200' : 'text-gray-700')}>
            {t(item.scheduleFull.el, item.scheduleFull.en)}
          </p>
          </div>
          {onDismiss && (
            <div className="-mr-2 -mt-1.5 shrink-0">
              <button
                type="button"
                onClick={onDismiss}
                aria-label={t('Απόκρυψη σχεδίου', 'Hide plan')}
                title={t('Απόκρυψη', 'Hide')}
                className={cn(
                  'min-h-9 min-w-9 rounded-xl flex items-center justify-center transition-colors',
                  darkCard ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5',
                )}
              >
                <EyeOff className="w-4 h-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 px-4 pt-3.5 pb-3">
        <button
          type="button"
          onClick={() => go(`/events/${item.event.id}`)}
          className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 group"
          aria-label={t('Δες εκδήλωση', 'View event')}
        >
          <EventCoverImg
            event={item.event}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('card-badge font-semibold tracking-wide', darkCard ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400')}>
              {t(item.intentLabel.el, item.intentLabel.en)}
            </span>
            {item.isSavedEvent && (
              <span className={cn('card-badge font-medium', darkCard ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400')}>
                · {t('Αποθηκευμένη', 'Saved')}
              </span>
            )}
          </div>
          {!isSidebar && (
            <p className="card-heading font-bold leading-normal line-clamp-2 text-gray-900 dark:text-white">
              {item.event.title}
            </p>
          )}
          {isSidebar ? (
            <p className={cn('card-copy-sm leading-relaxed', darkCard ? 'text-gray-300' : 'text-gray-600')}>
              <span className={cn('font-semibold', darkCard ? 'text-gray-100' : 'text-gray-900')}>{displayName}</span>
              <span className={darkCard ? 'text-gray-500' : 'text-gray-400'} aria-hidden> · </span>
              <span className={cn('card-role font-semibold', roleText)}>{t(item.roleLabel.el, item.roleLabel.en)}</span>
            </p>
          ) : (
            <p className="card-copy leading-relaxed text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{displayName}</span>
              <span className="text-gray-400 dark:text-gray-500" aria-hidden> · </span>
              <span className={cn('card-role font-medium', roleText)}>
                {t(item.roleLabel.el, item.roleLabel.en)}
              </span>
            </p>
          )}
          <div className={cn('flex flex-wrap gap-x-2.5 gap-y-1 card-meta leading-relaxed text-gray-500', !isSidebar && 'dark:text-gray-400')}>
            {!isSidebar && (
              <span className="inline-flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                <Clock className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {t(item.scheduleFull.el, item.scheduleFull.en)}
              </span>
            )}
            {isSidebar && locationLine && (
              <span className={cn('inline-flex items-center gap-1', darkCard ? 'text-gray-400' : 'text-gray-600')}>
                <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {locationLine}
              </span>
            )}
            {!isSidebar && locationLine && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px] font-medium text-gray-600 dark:text-gray-300">
                <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {locationLine}
              </span>
            )}
          </div>
        </div>
      </div>

      <p
        className={cn(
          'px-4 pb-3 card-meta flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-relaxed',
          darkCard ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300',
        )}
      >
        {showUrgency && (
          <>
            <span className={cn('inline-flex items-center gap-1 font-semibold', urgencyText[item.urgency.tone])}>
              <Clock className="w-2.5 h-2.5 opacity-70" aria-hidden />
              {t(item.urgency.el, item.urgency.en)}
            </span>
            <span aria-hidden className="opacity-40">·</span>
          </>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="w-2.5 h-2.5 opacity-70" aria-hidden />
          {t(item.groupSizeLabel.el, item.groupSizeLabel.en)}
        </span>
        <span aria-hidden className="opacity-40">·</span>
        <span>{t(item.meetingLabel.el, item.meetingLabel.en)}</span>
        {item.sharedInterestTags.length > 0 && (
          <>
            <span aria-hidden className="opacity-40">·</span>
            <span className="line-clamp-1">
              {item.sharedInterestTags
                .slice(0, 2)
                .map((tag) => interestLabel(tag, language))
                .join(' · ')}
            </span>
          </>
        )}
        {item.sharedInterestCount > 0 && item.sharedInterestTags.length === 0 && (
          <>
            <span aria-hidden className="opacity-40">·</span>
            <span>{t(countNoun(item.sharedInterestCount, 'κοινό', 'κοινά'), `${item.sharedInterestCount} shared`)}</span>
          </>
        )}
      </p>

      {item.intent.message && (
        <div
          className={cn(
            'mx-4 mb-3 pl-3 pr-2.5 py-2.5 flex gap-2 border-l-2',
            darkCard ? 'border-l-white/20 text-gray-300' : 'border-l-gray-200 dark:border-l-white/15',
          )}
        >
          <p className={cn('card-copy line-clamp-2 leading-relaxed', darkCard ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300')}>
            «{item.intent.message}»
          </p>
        </div>
      )}

      {showMatchReason && item.matchReason && (
        <p className="px-4 pb-3 card-copy leading-relaxed text-gray-400 dark:text-gray-500">
          {t(item.matchReason.el, item.matchReason.en)}
        </p>
      )}

      <div className="flex items-center gap-1.5 px-4 pb-3.5 pt-1.5">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className={cn(
            'px-3.5 min-h-8 py-1.5 rounded-full card-cta bg-cyan-600 hover:bg-cyan-500 text-white transition-colors',
            isSidebar && 'flex-1',
          )}
        >
          {t('Αίτημα συμμετοχής', 'Ask to join')}
        </button>
        <button
          type="button"
          onClick={() => go(`/events/${item.event.id}`)}
          className={cn(
            'px-2.5 min-h-8 py-1.5 rounded-full card-cta transition-colors',
            darkCard ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5',
          )}
        >
          {t('Εκδήλωση', 'Event')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isSaved) unsaveRequest(item.intent.id);
            else saveRequest(item.intent.id);
            toast.message(
              isSaved
                ? t('Αφαιρέθηκε', 'Removed')
                : t('Αποθηκεύτηκε ιδιωτικά — δημοσίευσέ το όποτε θέλεις', 'Saved privately — publish anytime'),
            );
          }}
          className={cn(
            'ml-auto min-h-8 min-w-8 rounded-full flex items-center justify-center transition-colors',
            darkCard ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5',
            isSaved && (darkCard ? 'text-cyan-400 bg-cyan-500/10' : 'text-cyan-700 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/10'),
          )}
          aria-label={t('Αποθήκευση σχεδίου', 'Save plan')}
          title={t('Αποθήκευση σχεδίου', 'Save plan')}
        >
          <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
        </button>
        {onDismiss && !isSidebar && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('Απόκρυψη σχεδίου', 'Hide plan')}
            title={t('Απόκρυψη', 'Hide')}
            className={cn(
              'min-h-8 min-w-8 rounded-full flex items-center justify-center transition-colors',
              darkCard ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5',
            )}
          >
            <EyeOff className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      <JoinRequestPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        seeker={item.seeker}
        event={item.event}
        mode="send"
        onSendRequest={() => {
          const id = sendJoin(item.intent.id);
          if (id) toast.success(t('Αίτημα εστάλη — θα ειδοποιηθεί ο/η δημιουργός', 'Request sent — creator notified'));
        }}
      />
    </article>
  );
}

export function PlansFormingGroupCard({
  entry,
  variant = 'sidebar',
  isDarkSurface = false,
  onSuggestMerge,
  onNavigate,
  imageDepth = 'full',
}: {
  entry: PlansFormingGroupItem;
  variant?: 'sidebar' | 'sheet' | 'page';
  isDarkSurface?: boolean;
  onSuggestMerge?: () => void;
  onNavigate?: (path: string) => void;
  imageDepth?: EventCardImageDepth;
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };
  const compact = variant !== 'page';
  const onDark = compact && isDarkSurface;
  const { group, event, meta } = entry;
  const locationLine = meta.location ? formatLocationArea(meta.location, language) : '';
  const ink = onDark ? 'text-white' : 'text-ink';
  const muted = onDark ? 'text-gray-400' : 'text-ink-muted';
  const role = onDark ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-300';
  const depth = imageDepth;
  const flags = cardImageDepthFlags(depth);

  return (
    <article
      className={cn(
        'nakamas-card isolate overflow-hidden rounded-2xl shadow-soft flex flex-col',
        onDark ? 'bg-white/[0.04]' : 'bg-white dark:bg-gray-900',
      )}
    >
      <CardImageDepthFrame
        event={event}
        depth={depth}
        photoHeightClass={variant === 'page' ? 'h-48 md:h-64 lg:h-80' : variant === 'sheet' ? 'h-36' : 'h-48'}
        onPhotoClick={() => go(`/events/${event.id}`)}
        photoAriaLabel={t('Δες εκδήλωση', 'View event')}
        overlay={
          <>
            <p className="card-badge font-semibold tracking-wide text-emerald-200">
              {t('Ομάδα δέχεται μέλη', 'Group recruiting')}
            </p>
            <h3 className="card-heading-lg font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">{event.title}</h3>
            {flags.coverOrganizer && meta.hostFirstName && (
              <p className="card-copy leading-relaxed text-white/85">
                <span className="font-semibold text-white">{meta.hostFirstName}</span>
                <span className="opacity-50" aria-hidden>{' · '}</span>
                <span className="card-role font-medium">{t('Οργανώνει ομάδα', 'Group host')}</span>
              </p>
            )}
            {flags.coverFacts && (
              <div className="space-y-2">
                <FactSpread mutedClass="text-white/85" left={t(meta.scheduleFull.el, meta.scheduleFull.en)} />
                <FactSpread
                  mutedClass="text-white/85"
                  leftIcon={variant === 'page' ? <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden /> : null}
                  left={locationLine}
                  rightIcon={variant === 'page' ? <Users className="w-3 h-3 shrink-0 opacity-70" aria-hidden /> : null}
                  right={`${meta.filled}/${meta.target} ${t('μέλη', 'members')} · ${meta.spots} ${t('ανοιχτές θέσεις', 'open spots')}`}
                />
              </div>
            )}
            {flags.coverRoomy && <div className="min-h-16 flex-1" aria-hidden />}
            {flags.coverFull && meta.note && (
              <p className="card-copy leading-relaxed text-white/85">«{meta.note}»</p>
            )}
            {flags.coverProgress && (
              <div className="mt-auto border-t border-white/25 pt-4">
                <GroupProgressBar current={meta.filled} target={meta.target} onPhoto className={flags.coverFull ? 'mb-3' : undefined} />
                {flags.coverFull && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => go(`/events/${event.id}/join?group=${group.id}`)}
                      className="px-4 min-h-9 rounded-full card-cta bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      {t('Αίτημα συμμετοχής', 'Ask to join')}
                    </button>
                    <button
                      type="button"
                      onClick={() => go(`/events/${event.id}`)}
                      className="min-h-9 card-cta text-white/90 transition-colors hover:text-white"
                    >
                      {t('Εκδήλωση', 'Event')}
                    </button>
                    {onSuggestMerge && (
                      <button
                        type="button"
                        onClick={onSuggestMerge}
                        className="min-h-9 card-cta text-white/80 transition-colors hover:text-white"
                      >
                        {t('Συγχώνευση', 'Merge')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        }
      >
      <div className={cn(compact ? 'space-y-3.5 px-4 py-4' : 'space-y-4 px-5 py-5')}>
        {!flags.coverTitle && (
        <p className={cn('card-badge font-semibold tracking-wide', role)}>
          {t('Ομάδα δέχεται μέλη', 'Group recruiting')}
        </p>
        )}
        <div className="space-y-1.5">
          {!flags.coverTitle && (
          <h3 className={cn('card-heading-lg font-bold leading-snug', ink)}>{event.title}</h3>
          )}
          {!flags.coverOrganizer && (
          <p className={cn('card-copy leading-relaxed', muted)}>
            {meta.hostFirstName && (
              <>
                <span className={cn('font-semibold', ink)}>{meta.hostFirstName}</span>
                <span className="opacity-50" aria-hidden>
                  {' · '}
                </span>
              </>
            )}
            <span className={cn('card-role font-medium', role)}>
              {t('Οργανώνει ομάδα', 'Group host')}
            </span>
          </p>
          )}
        </div>
        {!flags.coverFacts && (
        <div className="space-y-2">
          <FactSpread mutedClass={muted} left={t(meta.scheduleFull.el, meta.scheduleFull.en)} />
          <FactSpread
            mutedClass={muted}
            leftIcon={variant === 'page' ? <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden /> : null}
            left={locationLine}
            rightIcon={variant === 'page' ? <Users className="w-3 h-3 shrink-0 opacity-70" aria-hidden /> : null}
            right={`${meta.filled}/${meta.target} ${t('μέλη', 'members')} · ${meta.spots} ${t('ανοιχτές θέσεις', 'open spots')}`}
          />
        </div>
        )}
        {!flags.coverProgress && (
        <div className={cn('h-1.5 overflow-hidden rounded-full', onDark ? 'bg-white/10' : 'bg-black/[0.06]')}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${meta.progress}%` }} />
        </div>
        )}
        {meta.note && (
          <p className={cn('card-copy leading-relaxed', muted)}>«{meta.note}»</p>
        )}
        {!flags.coverFull && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <button
            type="button"
            onClick={() => go(`/events/${event.id}/join?group=${group.id}`)}
            className="px-4 min-h-9 rounded-full card-cta bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            {t('Αίτημα συμμετοχής', 'Ask to join')}
          </button>
          {onSuggestMerge && (
            <button
              type="button"
              onClick={onSuggestMerge}
              className={cn('min-h-9 card-cta transition-colors', muted, onDark ? 'hover:text-white' : 'hover:text-ink')}
            >
              {t('Συγχώνευση', 'Merge')}
            </button>
          )}
        </div>
        )}
      </div>
      </CardImageDepthFrame>
    </article>
  );
}