import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { KeepChatRequestModal } from './KeepChatRequestModal';
import { MeetingPointActions } from './MeetingPointPanel';
import { meetingPointLabel } from '../../lib/meetingPoint';

/**
 * One compact status block: meeting point + arrival/map, and the 24h window.
 * Replaces stacked banners so the address is said once.
 */
export function GroupChatStatusStrip({
  conversationId,
  isEphemeral,
  venue,
  meetingPoint,
  meetAt,
  locked,
  canAnnounce = true,
}: {
  conversationId: string;
  isEphemeral: boolean;
  venue?: string;
  meetingPoint?: string;
  meetAt?: string;
  locked?: boolean;
  canAnnounce?: boolean;
}) {
  const { t } = useLanguage();
  const dismissedIds = useChatStore((s) => s.dismissedEphemeralBanners);
  const dismissed = dismissedIds.includes(conversationId);
  const dismiss = useChatStore((s) => s.dismissEphemeralBanner);
  const undismiss = useChatStore((s) => s.undismissEphemeralBanner);
  const [keepOpen, setKeepOpen] = useState(false);

  const showEphemeral = isEphemeral && !dismissed;
  const hasMeeting = Boolean(meetingPoint || venue);
  if (!showEphemeral && !hasMeeting) return null;

  const point = meetingPointLabel(venue, meetingPoint);

  return (
    <>
      <div
        className="relative z-0 px-3 py-2 border-b border-border/80 bg-surface-raised/50 space-y-2"
        data-chat-status-strip=""
      >
        {hasMeeting &&
          (locked ? (
            <p className="text-xs text-ink-muted">
              {t('Σημείο συνάντησης μετά την επιβεβαίωση', 'Meeting point available after confirmation')}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-bold text-brand tracking-wide">
                  {t('Σημείο συνάντησης', 'Meeting point')}
                </p>
                <p className="text-xs font-medium text-ink leading-snug">
                  {meetAt ? `${point} · ${meetAt}` : point}
                </p>
              </div>
              <MeetingPointActions
                conversationId={conversationId}
                venue={venue}
                meetingPoint={meetingPoint}
                compact
                canAnnounce={canAnnounce && !locked}
              />
            </div>
          ))}
        {showEphemeral && (
          <div className="flex items-center gap-2 text-2xs text-ink-muted">
            <p className="min-w-0 flex-1 leading-snug">
              {t('Προσωρινό · 24ω μετά την εκδήλωση', 'Temporary · 24h after the event')}
            </p>
            <button
              type="button"
              onClick={() => setKeepOpen(true)}
              className="shrink-0 font-bold text-ink hover:underline underline-offset-2"
            >
              {t('Διατήρηση', 'Keep')}
            </button>
            <button
              type="button"
              onClick={() => {
                dismiss(conversationId);
                toast.info(t('Η ειδοποίηση αποκρύφθηκε', 'Banner dismissed'), {
                  action: {
                    label: t('Αναίρεση', 'Undo'),
                    onClick: () => undismiss(conversationId),
                  },
                });
              }}
              aria-label={t('Απόκρυψη', 'Dismiss')}
              className="shrink-0 p-0.5 rounded-full hover:bg-ink/5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {showEphemeral && (
        <KeepChatRequestModal open={keepOpen} onClose={() => setKeepOpen(false)} conversationId={conversationId} />
      )}
    </>
  );
}
