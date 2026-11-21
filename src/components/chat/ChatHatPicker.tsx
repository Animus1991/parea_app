import { X } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { CHAT_HAT_STYLES } from '../../lib/chatHatStyles';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { ChatHatThumb } from './ChatHatThumb';

export function ChatHatPicker() {
  const { t } = useLanguage();
  const selected = useUIStore((s) => s.chatHatStyle);
  const dismissed = useUIStore((s) => s.dismissedChatHats);
  const setChatHatStyle = useUIStore((s) => s.setChatHatStyle);
  const dismissChatHat = useUIStore((s) => s.dismissChatHat);
  const { pathname } = useLocation();
  const hideOnPhones =
    Boolean(matchPath('/events/:eventId/join', pathname)) ||
    Boolean(matchPath('/history/feedback/:eventId', pathname));
  const onSettings = pathname.startsWith('/settings');
  const visible = CHAT_HAT_STYLES.filter((h) => !dismissed.includes(h.id));
  if (visible.length === 0 || onSettings) return null;

  return (
    <div
      className={cn(
        'chat-hat-picker fixed z-chat-toggle left-3 right-3 md:left-auto md:right-6 md:w-[min(42rem,calc(100vw-8rem))]',
        'xl:right-[calc(300px+1.5rem)] 2xl:right-[calc(340px+1.5rem)] copilot-shift',
        'rounded-2xl border border-border bg-surface/95 backdrop-blur-md shadow-soft-lg px-3 pt-2 pb-2',
        hideOnPhones && 'max-md:hidden',
      )}
      role="region"
      aria-label={t('Επιλογή καπέλου συνομιλιών', 'Chat hat picker')}
    >
      <p className="mb-1.5 text-2xs font-bold text-ink flex items-baseline justify-between gap-2">
        <span>
          {t(
            'Πάτα ένα καπέλο για δοκιμή στο κουμπί. Το × το αφαιρεί.',
            'Tap a hat to try it on the button. × removes it.',
          )}
        </span>
        <Link
          to="/settings?section=chat"
          className="shrink-0 text-brand font-extrabold hover:underline"
        >
          {t('Ρυθμίσεις', 'Settings')}
        </Link>
      </p>
      <div className="flex gap-3 overflow-x-auto pt-2 pb-1 noscrollbar">
        {visible.map((hat) => {
          const label = t(hat.labelEl, hat.labelEn);
          const active = selected === hat.id;
          return (
            <div key={hat.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setChatHatStyle(hat.id)}
                aria-pressed={active}
                aria-label={t(`Δοκιμή: ${hat.labelEl}`, `Try: ${hat.labelEn}`)}
                title={label}
                className={cn(
                  'inline-flex items-center justify-center p-0 m-0 bg-transparent border-0 rounded-full',
                  active && 'ring-2 ring-brand ring-offset-2 ring-offset-surface',
                )}
              >
                <ChatHatThumb hat={hat} />
              </button>
              <button
                type="button"
                onClick={() => dismissChatHat(hat.id)}
                aria-label={t(`Αφαίρεση: ${hat.labelEl}`, `Remove: ${hat.labelEn}`)}
                className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-ink text-surface border border-ink shadow-soft-lg flex items-center justify-center hover:bg-ink/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
