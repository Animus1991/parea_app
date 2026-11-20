import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

export function MeetingPointActions({
  conversationId,
  venue,
  meetingPoint,
  compact = false,
}: {
  conversationId: string;
  venue?: string;
  meetingPoint?: string;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const viewer = useStore((s) => s.currentUser);
  const announceArrival = useChatStore((s) => s.announceArrival);
  const mapQuery = encodeURIComponent(venue ?? meetingPoint ?? '');

  return (
    <div className={cn('flex gap-1.5', compact ? 'shrink-0' : 'gap-2')}>
      <button
        type="button"
        className={cn(
          'rounded-full text-xs font-bold bg-brand/80 text-brand-fg',
          compact ? 'px-2.5 min-h-8' : 'flex-1 min-h-9',
        )}
        aria-label={t('Ανακοίνωση άφιξης', 'Announce arrival')}
        onClick={() => {
          if (!viewer) return;
          announceArrival(conversationId, viewer.id);
          toast.success(t('Έφτασα — ειδοποιήθηκαν τα μέλη', 'Arrived — members notified'));
        }}
      >
        {t('Έφτασα', 'I arrived')}
      </button>
      <button
        type="button"
        className={cn(
          'rounded-full text-xs font-bold border border-border-strong flex items-center justify-center gap-1',
          compact ? 'px-2 min-h-8 min-w-8' : 'px-3.5 min-h-9',
        )}
        aria-label={t('Άνοιγμα χάρτη', 'Open map')}
        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`, '_blank', 'noopener,noreferrer')}
      >
        <Navigation className="w-3 h-3" aria-hidden />
        {!compact && t('Χάρτης', 'Map')}
      </button>
    </div>
  );
}

export function MeetingPointPanel({
  conversationId,
  venue,
  meetingPoint,
  locked,
}: {
  conversationId: string;
  venue?: string;
  meetingPoint?: string;
  locked?: boolean;
}) {
  const { t } = useLanguage();

  if (locked) {
    return (
      <div className="mx-3 mb-2 rounded-2xl border border-border bg-ink/[0.03] px-3 py-2 text-xs text-ink-muted">
        {t('Σημείο συνάντησης μετά την επιβεβαίωση', 'Meeting point available after confirmation')}
      </div>
    );
  }
  if (!meetingPoint && !venue) return null;

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-brand/20 bg-brand-soft px-3 py-2 space-y-2">
      <p className="text-xs font-bold text-brand flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5" />
        {t('Σημείο συνάντησης', 'Meeting point')}
      </p>
      {venue && <p className="text-xs text-ink font-medium">{venue}</p>}
      {meetingPoint && meetingPoint !== venue && (
        <p className="text-xs text-ink-muted">{meetingPoint}</p>
      )}
      <MeetingPointActions conversationId={conversationId} venue={venue} meetingPoint={meetingPoint} />
    </div>
  );
}
