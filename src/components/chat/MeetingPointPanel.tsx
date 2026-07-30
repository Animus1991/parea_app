import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';

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
  const viewer = useStore((s) => s.currentUser);
  const announceArrival = useChatStore((s) => s.announceArrival);

  if (locked) {
    return (
      <div className="mx-3 mb-2 rounded-xl border border-border bg-ink/[0.03] px-3 py-2 text-xs text-ink-muted">
        {t('Σημείο συνάντησης μετά την επιβεβαίωση', 'Meeting point available after confirmation')}
      </div>
    );
  }
  if (!meetingPoint && !venue) return null;

  const mapQuery = encodeURIComponent(venue ?? meetingPoint ?? '');

  return (
    <div className="mx-3 mb-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-2 space-y-2">
      <p className="text-xs font-bold text-brand flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5" />
        {t('Σημείο συνάντησης', 'Meeting point')}
      </p>
      {venue && <p className="text-xs text-ink font-medium">{venue}</p>}
      {meetingPoint && meetingPoint !== venue && (
        <p className="text-xs text-ink-muted">{meetingPoint}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 min-h-8 rounded-lg text-xs font-bold bg-brand/80 text-brand-fg"
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
          className="px-3 min-h-8 rounded-lg text-xs font-bold border border-border-strong flex items-center gap-1"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`, '_blank')}
        >
          <Navigation className="w-3 h-3" />
          {t('Χάρτης', 'Map')}
        </button>
      </div>
    </div>
  );
}
