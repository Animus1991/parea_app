import { toast } from 'sonner';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';

/** Shared waitlist handler for all EventDetail theme shells (Φ16.5). */
export function useEventWaitlist(eventId: string) {
  const waitlistedEvents = useStore((s) => s.waitlistedEvents);
  const addToWaitlist = useStore((s) => s.addToWaitlist);
  const { t } = useLanguage();
  const isWaitlisted = waitlistedEvents.includes(eventId);

  const handleJoinWaitlist = () => {
    if (isWaitlisted) return;
    addToWaitlist(eventId);
    toast.success(
      t(
        'Μπήκατε στη λίστα αναμονής — θα ειδοποιηθείτε αν ανοίξει θέση.',
        'You joined the waitlist — we will notify you if a spot opens.',
      ),
    );
  };

  return { isWaitlisted, handleJoinWaitlist };
}
