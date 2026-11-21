import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { chatHatById, visibleChatHats } from '../../lib/chatHatStyles';
import { fileToChatHatDataUrl, MAX_CUSTOM_CHAT_HATS } from '../../lib/prepareChatHatImage';
import { imageErrorText } from '../../lib/imageResize';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { ChatHatThumb } from './ChatHatThumb';

export function ChatHatSettingsPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const selected = useUIStore((s) => s.chatHatStyle);
  const customChatHats = useUIStore((s) => s.customChatHats);
  const dismissedChatHats = useUIStore((s) => s.dismissedChatHats);
  const setChatHatStyle = useUIStore((s) => s.setChatHatStyle);
  const dismissChatHat = useUIStore((s) => s.dismissChatHat);
  const restoreChatHats = useUIStore((s) => s.restoreChatHats);
  const addCustomChatHat = useUIStore((s) => s.addCustomChatHat);
  const removeCustomChatHat = useUIStore((s) => s.removeCustomChatHat);
  const chatHatPos = useUIStore((s) => s.chatHatPos);
  const setChatHatPos = useUIStore((s) => s.setChatHatPos);
  const hats = visibleChatHats(customChatHats, dismissedChatHats);
  const current = chatHatById(selected, customChatHats) ?? hats[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const canAdd = customChatHats.length < MAX_CUSTOM_CHAT_HATS;
  const canRemove = hats.length > 1;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!canAdd) {
      toast.error(
        t(
          `Μπορείς να έχεις μέχρι ${MAX_CUSTOM_CHAT_HATS} δικά σου καπέλα.`,
          `You can keep up to ${MAX_CUSTOM_CHAT_HATS} of your own hats.`,
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const src = await fileToChatHatDataUrl(file);
      const n = customChatHats.length + 1;
      const added = addCustomChatHat({
        id: `custom_${crypto.randomUUID()}`,
        src,
        labelEl: `Δικό μου ${n}`,
        labelEn: `My hat ${n}`,
        custom: true,
      });
      if (added) {
        toast.success(t('Το καπέλο κόπηκε στο μέγεθος του κουμπιού', 'Hat cropped to the chat-button size'));
      } else {
        toast.error(
          t(
            `Μπορείς να έχεις μέχρι ${MAX_CUSTOM_CHAT_HATS} δικά σου καπέλα.`,
            `You can keep up to ${MAX_CUSTOM_CHAT_HATS} of your own hats.`,
          ),
        );
      }
    } catch (err) {
      toast.error(imageErrorText(err, t));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      role="region"
      aria-label={t('Επιλογή καπέλου συνομιλιών', 'Chat hat picker')}
    >
      <p className={cn('text-sm font-bold', a.head)}>
        {t('Εικονίδιο συνομιλιών', 'Chat icon')}
      </p>
      <p className={cn('text-xs mt-1 mb-4 leading-relaxed', a.sub)}>
        {t(
          'Διάλεξε ή ανέβασε δική σου εικόνα. Σύρε το καπέλο όπου θες· ένα πάτημα ανοίγει τις συνομιλίες.',
          'Choose or upload your own picture. Drag the hat anywhere; a tap opens chats.',
        )}
      </p>
      <div className="flex flex-col items-center gap-2 mb-4">
        {current && <ChatHatThumb hat={current} />}
        <span
          className={cn(
            'text-xs font-bold tracking-wider px-2 py-1 rounded-full',
            a.isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700',
          )}
        >
          {t('Ενεργό', 'Active')}
          {current ? `: ${t(current.labelEl, current.labelEn)}` : ''}
        </span>
        {chatHatPos && (
          <button
            type="button"
            onClick={() => {
              setChatHatPos(null);
              toast.success(t('Η θέση του καπέλου επαναφέρθηκε', 'Chat hat position reset'));
            }}
            className={cn(
              'text-xs font-bold underline underline-offset-2',
              a.isDark ? 'text-cyan-300' : 'text-cyan-700',
            )}
          >
            {t('Επαναφορά θέσης', 'Reset position')}
          </button>
        )}
        {dismissedChatHats.length > 0 && (
          <button
            type="button"
            onClick={() => {
              restoreChatHats();
              toast.success(t('Τα κρυμμένα καπέλα επανήλθαν', 'Hidden hats restored'));
            }}
            className={cn(
              'text-xs font-bold underline underline-offset-2',
              a.isDark ? 'text-cyan-300' : 'text-cyan-700',
            )}
          >
            {t('Εμφάνιση κρυμμένων καπέλων', 'Show hidden hats')}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        aria-label={t('Ανέβασμα καπέλου', 'Upload a hat')}
        onChange={(event) => void onPick(event.target.files?.[0])}
      />
      <div
        role="radiogroup"
        aria-label={t('Εικονίδιο συνομιλιών', 'Chat icon')}
        className="grid grid-cols-3 sm:grid-cols-4 gap-3"
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || !canAdd}
          aria-label={t('Προσθήκη καπέλου', 'Add a hat')}
          className={cn(
            'relative flex min-h-[7.5rem] flex-col items-center justify-center gap-1 rounded-2xl p-2 border border-dashed bg-transparent',
            a.borderB,
            (busy || !canAdd) && 'opacity-60',
          )}
        >
          <Plus className="h-6 w-6 text-brand" aria-hidden />
          <span className={cn('text-2xs font-bold text-center leading-tight px-0.5', a.sub)}>
            {busy
              ? t('Προετοιμασία…', 'Preparing…')
              : t('Προσθήκη', 'Add')}
          </span>
        </button>
        {hats.map((hat) => {
          const active = selected === hat.id;
          const label = t(hat.labelEl, hat.labelEn);
          return (
            <div key={hat.id} className="relative">
              <button
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={t(`Επιλογή: ${hat.labelEl}`, `Choose: ${hat.labelEn}`)}
                title={label}
                onClick={() => {
                  setChatHatStyle(hat.id);
                  toast.success(t('Το καπέλο συνομιλιών αποθηκεύτηκε', 'Chat hat saved'));
                }}
                className={cn(
                  'relative flex w-full flex-col items-center gap-1 rounded-2xl p-2 border bg-transparent',
                  active ? 'ring-2 ring-brand border-brand' : a.borderB,
                )}
              >
                <ChatHatThumb hat={hat} className="w-20 h-20 md:w-24 md:h-24" />
                <span className={cn('text-2xs font-bold text-center leading-tight px-0.5', a.sub)}>
                  {label}
                </span>
              </button>
              {canRemove && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (hat.custom) {
                      removeCustomChatHat(hat.id);
                      toast.success(t('Το καπέλο διαγράφηκε', 'Hat deleted'));
                    } else {
                      dismissChatHat(hat.id);
                      toast.success(t('Το καπέλο κρύφτηκε', 'Hat hidden'));
                    }
                  }}
                  className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-raised text-ink-muted shadow-soft"
                  aria-label={
                    hat.custom
                      ? t(`Διαγραφή: ${hat.labelEl}`, `Delete: ${hat.labelEn}`)
                      : t(`Απόκρυψη: ${hat.labelEl}`, `Hide: ${hat.labelEn}`)
                  }
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
