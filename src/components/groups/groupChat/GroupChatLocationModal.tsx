import type { Dispatch, SetStateAction } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../../lib/i18n';
import { cn } from '../../../lib/utils';
import { Modal } from '../../common/Modal';
import { AppSelect } from '../../common/AppSelect';
import type { useGroupChatContrast } from '../../../hooks/useGroupChatContrast';
import type { GroupChatMessage } from '../../../hooks/useGroupChatMessages';

export interface LocationConfig {
  precision: string;
  shareWith: string;
  duration: string;
}

interface GroupChatLocationModalProps {
  open: boolean;
  gc: ReturnType<typeof useGroupChatContrast>;
  isSharingLocation: boolean;
  locationConfig: LocationConfig;
  currentUserName: string;
  onClose: () => void;
  onStopSharing: () => void;
  onStartSharing: () => void;
  setLocationConfig: Dispatch<SetStateAction<LocationConfig>>;
  setMessages: Dispatch<SetStateAction<GroupChatMessage[]>>;
  setIsSharingLocation: (value: boolean) => void;
}

export function GroupChatLocationModal({
  open,
  gc,
  isSharingLocation,
  locationConfig,
  currentUserName,
  onClose,
  onStopSharing,
  onStartSharing,
  setLocationConfig,
  setMessages,
  setIsSharingLocation,
}: GroupChatLocationModalProps) {
  const { t } = useLanguage();

  const handleConfirm = () => {
    setIsSharingLocation(true);
    onClose();
    let msg = t('ξεκίνησε να κοινοποιεί τοποθεσία', 'started sharing location');
    if (locationConfig.precision === 'approximate') {
      msg = t('κοινοποιεί το ETA/απόσταση', 'is sharing their ETA/distance');
    }
    if (locationConfig.shareWith === 'organizer') {
      msg += t(' (Μόνο στον διοργανωτή)', ' (Organizer only)');
    }
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: t("Σύστημα", "System"),
        text: `${currentUserName} ${msg}. ${t('Προεπισκόπηση — το pin δεν στάλθηκε ακόμη στην ομάδα.', 'Preview — the pin was not sent to the group yet.')}`,
        timestamp: new Date().toISOString(),
        type: 'location',
      },
    ]);
    toast.success(
      t('Προεπισκόπηση κοινοποίησης — το pin δεν στάλθηκε ακόμη.', 'Sharing preview — the pin was not sent yet.'),
    );
    onStartSharing();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Κοινοποίηση τοποθεσίας', 'Share location')}
      size="md"
    >
      <p className="text-xs font-medium text-ink-muted -mt-1 mb-4 flex items-center gap-2">
        <span className={cn('w-8 h-8 rounded-full flex items-center justify-center', gc.panelAccent)}>
          <MapPin className="w-4 h-4" />
        </span>
        {t('Προαιρετικό & προσωρινό', 'Optional & temporary')}
      </p>

      <div className="space-y-4">
        {isSharingLocation && (
          <div className={cn('rounded-2xl p-4 flex flex-col gap-3 shadow-soft border', gc.panelSoft)}>
            <div className={cn('flex items-center gap-2', gc.shareActiveText)}>
              <Navigation className="w-4 h-4 animate-pulse motion-reduce:animate-none" />
              <span className="text-sm font-bold">
                {t('Η τοποθεσία σου κοινοποιείται', 'You are currently sharing location')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSharingLocation(false);
                onClose();
                onStopSharing();
              }}
              className="w-full bg-surface-raised text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 py-2 rounded-lg text-xs font-bold tracking-wide"
            >
              {t('Διακοπή κοινοποίησης', 'Stop Sharing Now')}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wide text-ink-muted">1. {t('Ακρίβεια', 'Precision')}</h4>
          <div className="grid grid-cols-2 gap-3">
            {(['approximate', 'exact'] as const).map((precision) => (
              <button
                key={precision}
                type="button"
                onClick={() => setLocationConfig({ ...locationConfig, precision })}
                className={cn(
                  'p-3 rounded-2xl border text-left flex flex-col h-full transition-all duration-200',
                  locationConfig.precision === precision
                    ? 'border-ink bg-surface ring-1 ring-ink shadow-soft'
                    : 'border-border hover:border-accent/40',
                )}
              >
                <span className={cn('text-sm font-bold', locationConfig.precision === precision ? 'text-ink' : 'text-ink-muted')}>
                  {precision === 'approximate' ? t('Κατά προσέγγιση', 'Approximate') : t('Ακριβής', 'Exact')}
                </span>
                <span className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {precision === 'approximate'
                    ? t('Μόνο απόσταση & ETA, όχι live τοποθεσία', 'Distance & ETA only, no map pin')
                    : t('Ακριβής θέση στον χάρτη (προσωρινά)', 'Exact map pin (temporary)')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wide text-ink-muted">2. {t('Ορατότητα', 'Share With')}</h4>
          <div className="flex flex-col gap-2">
            {(['organizer', 'all'] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200',
                  locationConfig.shareWith === option
                    ? cn(gc.selectedRow, 'shadow-soft')
                    : 'border-border hover:bg-surface',
                )}
              >
                <div className="flex items-center justify-center relative">
                  <input
                    type="radio"
                    name="shareWith"
                    className="sr-only"
                    checked={locationConfig.shareWith === option}
                    onChange={() => setLocationConfig({ ...locationConfig, shareWith: option })}
                  />
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border flex items-center justify-center',
                      locationConfig.shareWith === option ? gc.radioOn : 'border-border',
                    )}
                  >
                    {locationConfig.shareWith === option && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink">
                    {option === 'organizer' && t('Μόνο στον διοργανωτή', 'Organizer Only')}
                    {option === 'all' && t('Ολόκληρη η ομάδα', 'Entire Confirmed Group')}
                  </span>
                  {option === 'organizer' && (
                    <span className="text-xs text-ink-muted leading-relaxed">
                      {t('Ιδανικό για ξεναγήσεις ή πεζοπορίες', 'Best for guided hikes or escapes')}
                    </span>
                  )}
                  {option === 'all' && (
                    <span className="text-xs text-amber-600 leading-relaxed">
                      {t('Όλοι θα βλέπουν την τοποθεσία σου', 'Everyone in this chat will see your location')}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wide text-ink-muted">3. {t('Αυτόματη λήξη', 'Auto-Expiry')}</h4>
          <AppSelect
            ariaLabel={t("Διάρκεια κοινοποίησης τοποθεσίας", "Location sharing duration")}
            value={locationConfig.duration}
            onValueChange={(v) => setLocationConfig({ ...locationConfig, duration: v })}
            className="w-full border border-border rounded-2xl p-3 text-sm font-medium bg-surface-raised shadow-soft"
            options={[
              { value: 'arrival', label: t('Μέχρι να φτάσω στο σημείο', 'Until I arrive at meeting point') },
              { value: 'event_start', label: t('Μέχρι να ξεκινήσει η εκδήλωση', 'Until event starts') },
              {
                value: 'event_end',
                label: t('Μέχρι το τέλος της εκδήλωσης', 'Until event ends (or organizer marks complete)'),
              },
              { value: '1hr', label: t('Για 1 ώρα', 'For 1 hour') },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <button
          type="button"
          data-autofocus
          onClick={handleConfirm}
          className="w-full px-4 py-2 min-h-9 text-xs font-bold text-accent-fg bg-accent hover:bg-accent-strong rounded-full transition-all duration-200 shadow-soft active:scale-[0.98]"
        >
          {isSharingLocation
            ? t('Ενημέρωση ρυθμίσεων', 'Update Configuration')
            : t('Έναρξη κοινοποίησης', 'Start Sharing')}
        </button>
      </div>
    </Modal>
  );
}
