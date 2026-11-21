import { useNavigate } from 'react-router-dom';
import { Users, Flag, EyeOff, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { plansFormingMatchReason } from '../../lib/plansFormingUtils';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { projectRequestForViewer } from '../../lib/companyRequestUtils';
import { getPhotoPlaceholder } from '../../lib/photoReveal';
import { cn } from '../../lib/utils';
import { CardInterestLine } from '../common/CardInterestLine';
import type { CompanyRequest } from '../../types/companyRequest';
import type { Event, User } from '../../types';
import { PhotoOrInitials } from '../common/PhotoOrInitials';

export function CompanyRequestCard({
  request,
  seeker,
  event,
  compact,
  darkSurface,
  onAskToJoin,
  onHide,
  onReport,
  onSave,
}: {
  request: CompanyRequest;
  seeker: User;
  event: Event;
  compact?: boolean;
  darkSurface?: boolean;
  onAskToJoin: () => void;
  onHide?: () => void;
  onReport?: () => void;
  onSave?: () => void;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const prefs = useStore((s) => s.companyRequestPreferences);
  const savedIds = useStore((s) => s.savedCompanyRequestIds);
  const saveRequest = useStore((s) => s.saveCompanyRequest);
  const unsaveRequest = useStore((s) => s.unsaveCompanyRequest);
  const savedEvents = useStore((s) => s.savedEvents);
  const projection = projectRequestForViewer(request, seeker, event, currentUser, prefs);
  const isSaved = savedIds.includes(request.id);
  const reason = currentUser && plansFormingMatchReason(currentUser, seeker, event, request, savedEvents);

  const title =
    projection.variant === 'anonymous'
      ? t(
          `Κάποιος ψάχνει Nakamas για «${event.title}»`,
          `Someone looking for Nakamas for "${event.title}"`,
        )
      : projection.displayName || t('Χρήστης', 'Member');

  const shell = darkSurface
    ? 'border-gray-700 bg-gray-800/60'
    : 'border-gray-200 bg-white shadow-soft';

  return (
    <article className={cn('nakamas-card rounded-2xl border p-3', shell, compact && 'p-2.5')}>
      <div className="flex gap-2.5">
        {projection.showPhoto && seeker.photoUrl ? (
          <span className="flex w-10 h-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-soft text-xs font-bold text-ink">
            <PhotoOrInitials src={seeker.photoUrl} name={projection.displayName || ""} imgClassName="h-full w-full object-cover" />
          </span>
        ) : (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
              darkSurface ? 'bg-cyan-900/40 text-cyan-200' : 'bg-cyan-50 text-cyan-800',
            )}
          >
            {projection.displayName ? getPhotoPlaceholder(projection.displayName) : <Users className="w-4 h-4" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('card-badge font-bold tracking-wide', darkSurface ? 'text-cyan-400' : 'text-cyan-700')}>
            {t('Βρες Nakamas', 'Find Nakamas')}
          </p>
          <p className={cn('card-heading font-bold truncate', darkSurface ? 'text-white' : 'text-gray-900')}>
            {title}
          </p>
          {request.message && (
            <p className={cn('card-copy mt-0.5 line-clamp-2', darkSurface ? 'text-gray-400' : 'text-gray-500')}>
              {request.message}
            </p>
          )}
          {projection.interests.length > 0 && (
            <CardInterestLine
              items={projection.interests}
              max={3}
              className={cn('mt-1.5', darkSurface ? 'text-gray-400' : 'text-gray-500')}
            />
          )}
          {(request.preferredGroupMin || request.preferredGroupMax) && (
            <p className={cn('card-meta mt-1', darkSurface ? 'text-gray-500' : 'text-gray-400')}>
              {t('Μέγεθος', 'Size')}: {request.preferredGroupMin ?? '—'}–{request.preferredGroupMax ?? '—'}
            </p>
          )}
          {reason && (
            <p className={cn('card-copy mt-1 line-clamp-2', darkSurface ? 'text-gray-500' : 'text-gray-400')}>
              {t(reason.el, reason.en)}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          onClick={onAskToJoin}
          className={cn(
            'flex-1 min-h-9 rounded-xl card-cta text-white',
            darkSurface ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-cyan-600 hover:bg-cyan-700',
          )}
        >
          {t('Αίτημα συμμετοχής', 'Ask to join')}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/events/${event.id}`)}
          className={cn(
            'px-3 min-h-9 rounded-xl card-cta border',
            darkSurface ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700',
          )}
        >
          {t('Εκδήλωση', 'Event')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isSaved) unsaveRequest(request.id);
            else saveRequest(request.id);
            onSave?.();
            toast.message(
              isSaved
                ? t('Αφαιρέθηκε', 'Removed from saved')
                : t('Αποθηκεύτηκε ιδιωτικά', 'Saved privately'),
            );
          }}
          className={cn(
            'min-h-9 min-w-9 rounded-xl border flex items-center justify-center',
            darkSurface ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600',
            isSaved && 'border-cyan-500/50 text-cyan-600',
          )}
          aria-label={t('Αποθήκευση', 'Save')}
        >
          <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {onHide && (
          <button type="button" onClick={onHide} className={cn('card-meta flex items-center gap-0.5', darkSurface ? 'text-gray-500' : 'text-gray-400')}>
            <EyeOff className="w-3 h-3" aria-hidden /> {t('Απόκρυψη', 'Hide')}
          </button>
        )}
        {onReport && (
          <button type="button" onClick={onReport} className={cn('card-meta flex items-center gap-0.5', darkSurface ? 'text-gray-500' : 'text-gray-400')}>
            <Flag className="w-3 h-3" aria-hidden /> {t('Αναφορά', 'Report')}
          </button>
        )}
      </div>
    </article>
  );
}
