import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { cn } from '../../lib/utils';

export interface EventDetailQrModalProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to current page URL */
  value?: string;
}

export function EventDetailQrModal({ open, onClose, value }: EventDetailQrModalProps) {
  const { t } = useLanguage();
  const c = useContrastTheme();

  if (!open) return null;

  const qrValue = value ?? (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Κοινοποίηση εκδήλωσης', 'Share event')}
    >
      <div
        className={cn('rounded-2xl p-6 md:p-8 max-w-sm w-full text-center relative shadow-2xl', c.modalPanel)}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-full transition-colors min-h-11 min-w-11 flex items-center justify-center',
            c.surfaceElevated,
            c.fgMuted,
            'hover:opacity-80',
          )}
          aria-label={t('Κλείσιμο', 'Close')}
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className={cn('text-xl font-bold mb-2', c.fg)}>{t('Κοινοποίηση', 'Share Event')}</h3>
        <p className={cn('text-sm mb-6', c.fgMuted)}>
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
      </div>
    </div>
  );
}
