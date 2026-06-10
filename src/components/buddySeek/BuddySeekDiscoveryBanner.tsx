import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, Sparkles, ChevronRight, Shield } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { projectRequestForViewer } from '../../lib/companyRequestUtils';
import { getPhotoPlaceholder } from '../../lib/photoReveal';
import { cn } from '../../lib/utils';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import type { BuddySeekDiscoveryItem } from '../../hooks/useBuddySeekDiscovery';

export interface BuddySeekDiscoveryBannerProps {
  item: BuddySeekDiscoveryItem;
  compact?: boolean;
  className?: string;
}

/** Non-ad community card: someone nearby is looking for company for an event. */
export function BuddySeekDiscoveryBanner({ item, compact, className }: BuddySeekDiscoveryBannerProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  const prefs = useStore((s) => s.companyRequestPreferences);
  const sendJoin = useStore((s) => s.sendCompanyJoinRequest);
  const [previewOpen, setPreviewOpen] = useState(false);

  const projection =
    currentUser && projectRequestForViewer(item.intent, item.seeker, item.event, currentUser, prefs);
  const showPhoto = projection?.showPhoto ?? false;
  const displayName =
    projection?.variant === 'anonymous'
      ? t('Κάποιος', 'Someone')
      : projection?.displayName || item.seeker.name.split(' ')[0];

  const shared = (item.seeker.interests ?? []).filter((i) =>
    (item.event.tags ?? []).some((tag) => tag.toLowerCase().includes(i.toLowerCase())),
  );

  return (
    <article
      className={cn(
        'rounded-2xl border overflow-hidden transition-all duration-200',
        'bg-gradient-to-br from-cyan-950/40 via-[#0f1419] to-indigo-950/30',
        'border-cyan-800/30 hover:border-cyan-600/50 shadow-soft',
        compact ? 'p-3' : 'p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {showPhoto && item.seeker.photoUrl ? (
            <img
              src={item.seeker.photoUrl}
              alt=""
              className={cn('rounded-2xl object-cover border border-white/15', compact ? 'w-11 h-11' : 'w-14 h-14')}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={cn(
                'rounded-2xl bg-cyan-900/50 border border-cyan-700/40 flex items-center justify-center font-bold text-cyan-100',
                compact ? 'w-11 h-11 text-sm' : 'w-14 h-14 text-lg',
              )}
            >
              {getPhotoPlaceholder(item.seeker.name)}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-[#0f1419]">
            <Users className="w-2.5 h-2.5 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/90 flex items-center gap-1 mb-0.5">
            <Sparkles className="w-3 h-3" />
            {t('Σχέδια που σχηματίζονται', 'Plans forming')}
          </p>
          <p className={cn('font-bold text-white leading-snug', compact ? 'text-sm' : 'text-sm')}>
            {displayName}
          </p>
          <p className={cn('text-gray-300 font-medium line-clamp-2 mt-0.5', compact ? 'text-xs' : 'text-sm')}>
            {item.event.title}
          </p>
          {item.intent.message && !compact && (
            <p className="text-xs text-gray-400 mt-1.5 italic line-clamp-2">"{item.intent.message}"</p>
          )}
          {prefs.showInterestsInDiscovery && shared.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {shared.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn('flex gap-2 mt-3', compact && 'mt-2')}>
        <button
          type="button"
          onClick={() => navigate(`/events/${item.event.id}`)}
          className={cn(
            'flex-1 min-h-10 rounded-2xl text-xs font-bold border border-white/15 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1',
          )}
        >
          {t('Δες εκδήλωση', 'View event')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex-1 min-h-10 rounded-2xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
        >
          {t('Αίτημα συμμετοχής', 'Ask to join')}
        </button>
      </div>

      <JoinRequestPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        seeker={item.seeker}
        event={item.event}
        mode="send"
        onSendRequest={() => {
          const id = sendJoin(item.intent.id);
          if (id) toast.success(t('Αίτημα εστάλη', 'Request sent'));
        }}
      />

      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <Shield className="w-3 h-3 shrink-0" />
        {t('Κοινότητα · όχι διαφήμιση', 'Community · not an ad')}
      </p>
    </article>
  );
}
