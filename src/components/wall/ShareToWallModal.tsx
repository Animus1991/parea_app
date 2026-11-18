import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../lib/i18n';
import { PostComposer } from './PostComposer';

/**
 * «Μοιράσου στον τοίχο» from an event page: the composer opens with the event
 * attached and a ready first line, so sharing a plan takes one tap.
 */
export default function ShareToWallModal({ eventId, eventTitle, open, onClose }: { eventId: string; eventTitle: string; open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} title={t('Μοιράσου στον τοίχο σου', 'Share on your wall')} size="lg">
      <p className="-mt-2 mb-3 text-sm font-medium text-ink-muted">
        {t(`«${eventTitle}» — πες στους Nakamas σου ότι πας και βρες παρέα.`, `“${eventTitle}” — tell your Nakamas you are going and find company.`)}
      </p>
      <PostComposer
        initialEventId={eventId}
        initialText={t('Πάω σε αυτό — ποιος έρχεται; ', 'I am going to this — who is coming? ')}
        focusOnOpen
        onPosted={() => {
          onClose();
          toast.success(t('Δημοσιεύτηκε στον τοίχο σου', 'Posted on your wall'), {
            action: { label: t('Άνοιγμα', 'Open'), onClick: () => navigate('/wall') },
          });
        }}
      />
    </Modal>
  );
}
