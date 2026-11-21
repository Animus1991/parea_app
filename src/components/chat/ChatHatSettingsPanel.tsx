import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { CHAT_HAT_STYLES, chatHatById } from '../../lib/chatHatStyles';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { ChatHatThumb } from './ChatHatThumb';

export function ChatHatSettingsPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const selected = useUIStore((s) => s.chatHatStyle);
  const setChatHatStyle = useUIStore((s) => s.setChatHatStyle);
  const chatHatPos = useUIStore((s) => s.chatHatPos);
  const setChatHatPos = useUIStore((s) => s.setChatHatPos);
  const current = chatHatById(selected) ?? CHAT_HAT_STYLES[0];

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
          'Διάλεξε το ψάθινο καπέλο του κουμπιού συνομιλιών. Μόνο αυτό εμφανίζεται στην εφαρμογή — εδώ βλέπεις όλες τις επιλογές. Σύρε το καπέλο οπουδήποτε στην οθόνη· ένα απλό πάτημα ανοίγει τις συνομιλίες.',
          'Choose the straw hat for the chat button. Only that hat appears in the app — every option lives here. Drag the hat anywhere on the screen; a tap opens chats.',
        )}
      </p>
      <div className="flex flex-col items-center gap-2 mb-4">
        <ChatHatThumb hat={current} />
        <span
          className={cn(
            'text-xs font-bold tracking-wider px-2 py-1 rounded-full',
            a.isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700',
          )}
        >
          {t('Ενεργό', 'Active')}: {t(current.labelEl, current.labelEn)}
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
      </div>
      <div
        role="radiogroup"
        aria-label={t('Εικονίδιο συνομιλιών', 'Chat icon')}
        className="grid grid-cols-3 sm:grid-cols-4 gap-3"
      >
        {CHAT_HAT_STYLES.map((hat) => {
          const active = selected === hat.id;
          const label = t(hat.labelEl, hat.labelEn);
          return (
            <button
              key={hat.id}
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
                'relative flex flex-col items-center gap-1 rounded-2xl p-2 border bg-transparent',
                active ? 'ring-2 ring-brand border-brand' : a.borderB,
              )}
            >
              <ChatHatThumb hat={hat} className="w-20 h-20 md:w-24 md:h-24" />
              <span className={cn('text-2xs font-bold text-center leading-tight px-0.5', a.sub)}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
