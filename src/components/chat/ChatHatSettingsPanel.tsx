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
  const dismissed = useUIStore((s) => s.dismissedChatHats);
  const restoreChatHats = useUIStore((s) => s.restoreChatHats);
  const current = chatHatById(selected) ?? CHAT_HAT_STYLES[0];

  return (
    <div className={cn('mb-4 pb-4 border-b', a.borderB)}>
      <p className={cn('text-sm font-medium', a.head)}>
        {t('Εικονίδιο συνομιλιών', 'Chat icon')}
      </p>
      <p className={cn('text-xs mt-0.5 mb-3', a.sub)}>
        {t(
          'Διάλεξε το ψάθινο καπέλο που φαίνεται στο κουμπί συνομιλιών.',
          'Choose the straw hat that appears on the chat button.',
        )}
      </p>
      <div className="flex justify-center mb-3">
        <ChatHatThumb hat={current} />
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
                'relative flex flex-col items-center gap-1 rounded-2xl p-1.5 border bg-transparent',
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
      {dismissed.length > 0 && (
        <button
          type="button"
          onClick={() => restoreChatHats()}
          className={cn('mt-3 text-xs font-bold underline-offset-2 hover:underline', a.head)}
        >
          {t('Εμφάνισε ξανά όλα στην προεπισκόπηση', 'Show all again on the preview row')}
        </button>
      )}
    </div>
  );
}
