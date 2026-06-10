import { MessageSquare, Lock, Check, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import type { Event, User } from '../../types';

const MOCK_PREVIEW = [
  { from: 'them', textEl: 'Γεια! Θα ήθελα να πάμε μαζί — είμαι ανοιχτός/ή σε ομαδική συνάντηση πριν.', textEn: 'Hi! I would like to go together — open to meeting as a group beforehand.' },
  { from: 'you', textEl: 'Τέλεια — προτείνω chat πρώτα και μετά συντονισμό στον χώρο.', textEn: 'Sounds good — chat first, then coordinate at the venue.' },
];

export function JoinRequestPreviewModal({
  open,
  onClose,
  seeker,
  event,
  message,
  onSendRequest,
  onAccept,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  seeker: User;
  event: Event;
  message?: string;
  onSendRequest: (note?: string) => void;
  onAccept?: () => void;
  mode: 'send' | 'owner_review';
}) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
            <MessageSquare className="w-4 h-4" />
            <h2 className="text-sm font-bold">
              {mode === 'send'
                ? t('Προεπισκόπηση πριν τη σύνδεση', 'Preview before connecting')
                : t('Αίτημα συμμετοχής', 'Join request')}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {t(
              'Η άμεση συνομιλία ξεκλειδώνεται μόνο μετά την αποδοχή και των δύο πλευρών.',
              'Direct chat unlocks only after both sides accept.',
            )}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{event.title}</p>
          <p className="text-xs text-gray-500">
            {mode === 'send'
              ? t(`Προς ${seeker.name.split(' ')[0]}`, `To ${seeker.name.split(' ')[0]}`)
              : t(`Από ${seeker.name.split(' ')[0]}`, `From ${seeker.name.split(' ')[0]}`)}
          </p>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
            {MOCK_PREVIEW.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs rounded-xl px-3 py-2 max-w-[90%]',
                  m.from === 'you'
                    ? 'ml-auto bg-cyan-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600',
                )}
              >
                {t(m.textEl, m.textEn)}
              </div>
            ))}
            {message && (
              <p className="text-xs italic text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
                {t('Το μήνυμά σας', 'Your note')}: {message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {t(
                'Αυτή είναι προεπισκόπηση — όχι πραγματική συνομιλία. Σχεδιασμένο με privacy controls.',
                'This is a preview — not a live chat. Designed with privacy controls.',
              )}
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-700 dark:text-gray-300"
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
          {mode === 'send' ? (
            <button
              type="button"
              onClick={() => {
                onSendRequest(message);
                onClose();
              }}
              className="flex-1 min-h-11 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold"
            >
              {t('Αποστολή αιτήματος', 'Send request')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onAccept?.();
                  onClose();
                }}
                className="flex-1 min-h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> {t('Αποδοχή', 'Accept')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 px-4 rounded-2xl border border-gray-200 text-sm font-bold flex items-center gap-1"
              >
                <X className="w-4 h-4" /> {t('Απόρριψη', 'Decline')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
