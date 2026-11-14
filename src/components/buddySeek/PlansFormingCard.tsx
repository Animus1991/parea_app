import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  MapPin,
  Clock,
  MessageCircle,
  Shield,
  Heart,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { projectRequestForViewer } from '../../lib/companyRequestUtils';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import { cn } from '../../lib/utils';
import type { PlansFormingEnrichedItem } from '../../lib/plansFormingUtils';
import type { PlansFormingGroupItem } from '../../hooks/usePlansFormingFeed';

const URGENCY_STYLES = {
  soon: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  normal: 'bg-white/10 text-gray-300 border-white/15',
  flexible: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

const URGENCY_STYLES_LIGHT = {
  soon: 'bg-amber-100 text-amber-800 border-amber-200',
  normal: 'bg-gray-100 text-gray-700 border-gray-200',
  flexible: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function PlansFormingCard({
  item,
  variant = 'sidebar',
  isDarkSurface = true,
  onDismiss,
}: {
  item: PlansFormingEnrichedItem;
  variant?: 'sidebar' | 'sheet' | 'inline' | 'page';
  isDarkSurface?: boolean;
  onDismiss?: () => void;
}) {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();
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
  const urgencyStyle = darkCard ? URGENCY_STYLES : URGENCY_STYLES_LIGHT;

  return (
    <article
      className={cn(
        'rounded-2xl border transition-colors duration-200 focus-within:ring-2 focus-within:ring-cyan-500/30',
        isSidebar
          ? darkCard
            ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
            : 'bg-white border-gray-200/80 shadow-soft hover:border-gray-300'
          : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-700/80 shadow-soft',
        item.isHighMatch && !isSidebar && 'border-cyan-200/70 dark:border-cyan-500/25',
      )}
    >
      {item.isHighMatch && (
        <div
          className={cn(
            'px-3 py-1.5 flex items-center justify-between gap-2 border-b text-xs font-bold',
            isSidebar ? (darkCard ? 'border-white/10 bg-cyan-500/10 text-cyan-300' : 'border-cyan-100 bg-cyan-50 text-cyan-800') : 'border-cyan-100 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200',
          )}
        >
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {t('Υψηλή συμβατότητα', 'High match')}
          </span>
          <span>{item.matchPercent}%</span>
        </div>
      )}

      {isSidebar && (
        <div className={cn('px-3 pt-3 pb-2 space-y-1.5 border-b', darkCard ? 'border-white/10' : 'border-gray-100')}>
          <button
            type="button"
            onClick={() => navigate(`/events/${item.event.id}`)}
            className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
          >
            <h3 className={cn('card-heading-lg font-bold leading-snug line-clamp-3', darkCard ? 'text-white' : 'text-gray-900')}>
              {item.event.title}
            </h3>
          </button>
          <p className={cn('card-meta-sm font-semibold leading-snug', darkCard ? 'text-gray-200' : 'text-gray-700')}>
            {t(item.scheduleFull.el, item.scheduleFull.en)}
          </p>
          <span
            className={cn(
              'inline-block card-role font-semibold px-2 py-0.5 rounded-lg border',
              item.roleLabel.kind === 'seeker'
                ? darkCard
                  ? 'bg-violet-500/15 text-violet-200 border-violet-500/30'
                  : 'bg-violet-100 text-violet-800 border-violet-200'
                : item.roleLabel.kind === 'group_builder'
                  ? darkCard
                    ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30'
                    : 'bg-cyan-100 text-cyan-800 border-cyan-200'
                  : darkCard
                    ? 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200',
            )}
          >
            {t(item.roleLabel.el, item.roleLabel.en)}
          </span>
        </div>
      )}

      <div className="flex gap-3 px-3.5 pt-3.5 pb-2">
        <button
          type="button"
          onClick={() => navigate(`/events/${item.event.id}`)}
          className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 group"
          aria-label={t('Δες εκδήλωση', 'View event')}
        >
          {item.event.imageUrl ? (
            <img
              src={item.event.imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-cyan-900/40 text-cyan-200 text-xs font-bold">
              {item.event.category?.slice(0, 2) ?? 'EV'}
            </div>
          )}
          <span
            className={cn(
              'absolute bottom-0.5 left-0.5 right-0.5 text-center text-xs font-semibold px-1 py-0.5 rounded-md backdrop-blur-sm border',
              urgencyStyle[item.urgency.tone],
            )}
          >
            {t(item.urgency.el, item.urgency.en)}
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="card-badge font-semibold uppercase tracking-wide text-cyan-700/80 dark:text-cyan-400/90">
              {tu(item.intentLabel.el, item.intentLabel.en)}
            </span>
            {item.isSavedEvent && (
              <span className="card-badge font-medium text-fuchsia-700/80 dark:text-fuchsia-300/90">
                · {t('Αποθηκευμένη', 'Saved')}
              </span>
            )}
          </div>
          {!isSidebar && (
            <p className="card-heading font-bold leading-snug line-clamp-2 text-gray-900 dark:text-white">
              {item.event.title}
            </p>
          )}
          {isSidebar ? (
            <p className={cn('card-copy-sm font-semibold', darkCard ? 'text-gray-100' : 'text-gray-900')}>{displayName}</p>
          ) : (
            <p className="card-copy text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{displayName}</span>
              <span className="text-gray-400 dark:text-gray-500" aria-hidden> · </span>
              <span className="card-role font-medium text-violet-700/80 dark:text-violet-300/90">
                {t(item.roleLabel.el, item.roleLabel.en)}
              </span>
            </p>
          )}
          <div className={cn('flex flex-wrap gap-x-2.5 gap-y-0.5 card-meta text-gray-500', !isSidebar && 'dark:text-gray-400')}>
            {!isSidebar && (
              <span className="inline-flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                <Clock className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {t(item.scheduleFull.el, item.scheduleFull.en)}
              </span>
            )}
            {isSidebar && item.location && (
              <span className={cn('inline-flex items-center gap-1', darkCard ? 'text-gray-400' : 'text-gray-600')}>
                <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {item.location}
              </span>
            )}
            {!isSidebar && item.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px] font-medium text-gray-600 dark:text-gray-300">
                <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {item.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
        <MetaChip isDark={darkCard} label={t(item.groupSizeLabel.el, item.groupSizeLabel.en)} icon={Users} />
        <MetaChip isDark={darkCard} label={t(item.meetingLabel.el, item.meetingLabel.en)} />
        {item.sharedInterestTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={cn(
              'card-copy font-medium px-1.5 py-0.5 rounded-md',
              darkCard ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300',
            )}
          >
            {tag}
          </span>
        ))}
        {item.sharedInterestCount > 0 && item.sharedInterestTags.length === 0 && (
          <MetaChip
            isDark={darkCard}
            label={t(`${item.sharedInterestCount} κοινά`, `${item.sharedInterestCount} shared`)}
          />
        )}
      </div>

      {item.intent.message && (
        <div
          className={cn(
            'mx-3.5 mb-2 pl-2.5 pr-2 py-1.5 flex gap-2 border-l-2',
            darkCard ? 'border-l-white/20 text-gray-300' : 'border-l-gray-200 dark:border-l-white/15',
          )}
        >
          <MessageCircle className={cn('w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60', darkCard ? 'text-gray-400' : 'text-gray-500')} aria-hidden />
          <p className={cn('card-copy line-clamp-2 leading-relaxed', darkCard ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300')}>
            «{item.intent.message}»
          </p>
        </div>
      )}

      {!isSidebar && (
        <p className="px-3.5 pb-2 card-copy leading-snug text-gray-400 dark:text-gray-500">
          {t(item.matchReason.el, item.matchReason.en)}
        </p>
      )}

      <div className="flex gap-2 px-3.5 pb-3.5 pt-0.5">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex-1 min-h-10 rounded-xl card-cta bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
        >
          {t('Αίτημα συμμετοχής', 'Ask to join')}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/events/${item.event.id}`)}
          className={cn(
            'px-3 min-h-10 rounded-xl card-cta transition-colors',
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
                : t('Αποθηκεύτηκε ιδιωτικά — δημοσιεύστε όποτε θέλετε', 'Saved privately — publish anytime'),
            );
          }}
          className={cn(
            'min-h-10 min-w-10 rounded-xl flex items-center justify-center transition-colors',
            darkCard ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5',
            isSaved && (darkCard ? 'text-cyan-400 bg-cyan-500/10' : 'text-cyan-700 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/10'),
          )}
          aria-label={t('Αποθήκευση σχεδίου', 'Save plan')}
        >
          <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
        </button>
      </div>

      {onDismiss && (
        <div className="px-3 pb-2 flex justify-between items-center border-t border-inherit pt-2 mx-3">
          <span className={cn('text-xs flex items-center gap-1', darkCard ? 'text-gray-500' : 'text-gray-400')}>
            <Shield className="w-3 h-3" />
            {t('Κοινότητα', 'Community')}
          </span>
          <button type="button" onClick={onDismiss} className="text-xs text-gray-500 hover:text-gray-300 font-medium">
            {t('Απόκρυψη', 'Hide')}
          </button>
        </div>
      )}

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

function MetaChip({
  label,
  icon: Icon,
  isDark,
}: {
  label: string;
  icon?: typeof Users;
  isDark?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 card-copy font-medium px-1.5 py-0.5 rounded-md',
        isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300',
      )}
    >
      {Icon && <Icon className="w-2.5 h-2.5 opacity-70" aria-hidden />}
      {label}
    </span>
  );
}

export function PlansFormingGroupCard({
  entry,
  variant = 'sidebar',
  isDarkSurface = true,
  onSuggestMerge,
}: {
  entry: PlansFormingGroupItem;
  variant?: 'sidebar' | 'sheet' | 'page';
  isDarkSurface?: boolean;
  onSuggestMerge?: () => void;
}) {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();
  const isSidebar = variant === 'sidebar';
  const darkCard = isSidebar && isDarkSurface;
  const { group, event, meta } = entry;

  return (
    <article
      className={cn(
        'rounded-2xl border overflow-hidden',
        darkCard
          ? 'bg-emerald-950/20 border-emerald-700/30'
          : isSidebar
            ? 'bg-white border-emerald-200 shadow-soft'
            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      )}
    >
      <div className="flex gap-3 p-3">
        {event.imageUrl && (
          <img src={event.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="card-badge font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {tu('Ομάδα δέχεται μέλη', 'Group recruiting')}
          </p>
          <p className={cn('card-heading-lg font-bold leading-snug line-clamp-2', darkCard ? 'text-white' : 'text-gray-900 dark:text-white')}>
            {event.title}
          </p>
          <p className={cn('card-meta-sm font-semibold leading-snug', darkCard ? 'text-emerald-100/90' : 'text-gray-700 dark:text-gray-200')}>
            {t(meta.scheduleFull.el, meta.scheduleFull.en)}
          </p>
          <span
            className={cn(
              'inline-block card-role font-semibold px-2 py-0.5 rounded-lg border',
              darkCard ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30',
            )}
          >
            {t('Οργανώνει ομάδα', 'Group host')}
          </span>
          {meta.hostFirstName && (
            <p className={cn('card-copy font-medium', darkCard ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300')}>
              {meta.hostFirstName}
            </p>
          )}
          {meta.location && (
            <p className={cn('card-copy flex items-center gap-1', darkCard ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400')}>
              <MapPin className="w-3 h-3 shrink-0" />
              {meta.location}
            </p>
          )}
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="flex justify-between card-copy font-bold mb-1">
          <span className={darkCard ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-300'}>
            {meta.filled}/{meta.target} {t('μέλη', 'members')}
          </span>
          <span className={darkCard ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}>
            {meta.spots} {t('ανοιχτές θέσεις', 'open spots')}
          </span>
        </div>
        <div className={cn('h-1.5 rounded-full overflow-hidden', darkCard ? 'bg-white/10' : 'bg-gray-200 dark:bg-white/10')}>
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${meta.progress}%` }} />
        </div>
        {meta.note && (
          <p className={cn('text-xs mt-2 line-clamp-2', darkCard ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400')}>
            «{meta.note}»
          </p>
        )}
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={() => navigate(`/events/${event.id}/join?group=${group.id}`)}
          className="flex-1 min-h-9 rounded-xl card-cta bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {t('Αίτημα συμμετοχής', 'Ask to join')}
        </button>
        {onSuggestMerge && (
          <button
            type="button"
            onClick={onSuggestMerge}
            className={cn(
              'px-3 min-h-9 rounded-xl card-cta border',
              darkCard ? 'border-emerald-600/40 text-emerald-300' : 'border-emerald-300 text-emerald-800 dark:border-emerald-600/40 dark:text-emerald-300',
            )}
          >
            {t('Συγχώνευση', 'Merge')}
          </button>
        )}
      </div>
    </article>
  );
}