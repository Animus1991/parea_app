import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { KeepChatRequestModal } from './KeepChatRequestModal';
import { MeetingPointActions, MeetingPointPanel } from './MeetingPointPanel';
import { meetingPointLabel } from '../../lib/meetingPoint';
import { cn } from '../../lib/utils';

/**
 * One slim status row for group chat: ephemeral window + meeting point.
 * Arrival and map stay one tap on the row; the full panel expands on demand.
 */
export function GroupChatStatusStrip({
  conversationId,
  isEphemeral,
  venue,
  meetingPoint,
  locked,
}: {
  conversationId: string;
  isEphemeral: boolean;
  venue?: string;
  meetingPoint?: string;
  locked?: boolean;
}) {
  const { t } = useLanguage();
  const dismissedIds = useChatStore((s) => s.dismissedEphemeralBanners);
  const dismissed = dismissedIds.includes(conversationId);
  const dismiss = useChatStore((s) => s.dismissEphemeralBanner);
  const undismiss = useChatStore((s) => s.undismissEphemeralBanner);
  const [keepOpen, setKeepOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const showEphemeral = isEphemeral && !dismissed;
  const hasMeeting = Boolean(meetingPoint || venue);
  if (!showEphemeral && !hasMeeting) return null;

  const point = meetingPointLabel(venue, meetingPoint);
  const statusText = [
    showEphemeral ? t('Προσωρινό · 24ω μετά την εκδήλωση', 'Temporary · 24h after the event') : null,
    hasMeeting && !locked && point
      ? t(`Σημείο: ${point}`, `Point: ${point}`)
      : hasMeeting && locked
        ? t('Σημείο μετά την επιβεβαίωση', 'Point after confirmation')
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-1 border-b border-border/80 text-xs text-ink-muted">
        <p className="min-w-0 flex-1 truncate leading-snug">{statusText}</p>
        {showEphemeral && (
          <button
            type="button"
            onClick={() => setKeepOpen(true)}
            className="tap-area-y shrink-0 font-medium text-ink hover:underline"
          >
            {t('Διατήρηση', 'Keep')}
          </button>
        )}
        {hasMeeting && !locked && !open && (
          <MeetingPointActions
            conversationId={conversationId}
            venue={venue}
            meetingPoint={meetingPoint}
            compact
          />
        )}
        {showEphemeral && (
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
            className="tap-area shrink-0 p-0.5 rounded-full hover:bg-ink/5"
          >
            <X className="w-3 h-3 text-ink-muted" />
          </button>
        )}
        {hasMeeting && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={
              open
                ? t('Απόκρυψη σημείου συνάντησης', 'Hide meeting point')
                : t('Λεπτομέρειες σημείου συνάντησης', 'Meeting point details')
            }
            className="tap-area shrink-0 p-1 rounded-full hover:bg-ink/5"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>
      {open && hasMeeting && (
        <div className="max-w-xl">
          <MeetingPointPanel
            conversationId={conversationId}
            venue={venue}
            meetingPoint={meetingPoint}
            locked={locked}
          />
        </div>
      )}
      {showEphemeral && (
        <KeepChatRequestModal open={keepOpen} onClose={() => setKeepOpen(false)} conversationId={conversationId} />
      )}
    </>
  );
}
