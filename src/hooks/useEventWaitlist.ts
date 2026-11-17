import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';

/** Shared waitlist handler for all EventDetail theme shells (Φ16.5). */
export function useEventWaitlist(eventId: string) {
  const waitlistedEvents = useStore((s) => s.waitlistedEvents);
  const addToWaitlist = useStore((s) => s.addToWaitlist);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isWaitlisted = waitlistedEvents.includes(eventId);

  const handleJoinWaitlist = () => {
    if (isWaitlisted) return;
    addToWaitlist(eventId);
    toast.success(
      t(
        'Αποθηκεύτηκε στα σχέδιά σου — παρακολούθησε από εκεί αν ανοίξει θέση.',
        'Saved on My plans — watch there if a seat opens.',
      ),
      {
        action: {
          label: t('Τα σχέδιά μου', 'My plans'),
          onClick: () => navigate('/plans'),
        },
      },
    );
  };

  return { isWaitlisted, handleJoinWaitlist };
}
