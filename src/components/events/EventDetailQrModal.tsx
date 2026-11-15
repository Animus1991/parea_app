import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../lib/i18n';
import { Modal } from '../common/Modal';

export interface EventDetailQrModalProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to current page URL */
  value?: string;
}

export function EventDetailQrModal({ open, onClose, value }: EventDetailQrModalProps) {
  const { t } = useLanguage();

  const qrValue = value ?? (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Κοινοποίηση', 'Share Event')}
      size="sm"
      className="text-center"
    >
      <p className="card-copy text-ink-muted mb-4">
        {t(
          'Σαρώστε αυτό το QR για να δείτε την εκδήλωση',
          'Scan this QR code to view the event',
        )}
      </p>
      <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 inline-block">
        <QRCodeSVG
          value={qrValue}
          size={200}
          bgColor="#ffffff"
          fgColor="#111827"
          level="H"
          includeMargin={false}
        />
      </div>
    </Modal>
  );
}
