import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Settings2, SlidersHorizontal, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { THEME_IDS, THEME_LABELS, THEME_SWATCH, type ThemeId } from '../../lib/themes';
import { applyThemeSelection } from '../../lib/applyTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { cn } from '../../lib/utils';

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 520;
const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

interface UserMenuProps {
  /** Visual content of the trigger (avatar, name). Without it a small settings icon is shown. */
  children?: ReactNode;
  /** Accessible name of the trigger. */
  label: string;
  /** Header shown at the top of the menu (signed-in user). */
  header?: ReactNode;
  /** Show the profile and settings links (signed-in only). */
  showAccountLinks?: boolean;
}

/**
 * One menu behind the avatar for the account, language and theme.
 * Replaces the separate language button and theme picker in the top bar.
 */
export function UserMenu({ children, label, header, showAccountLinks = false }: UserMenuProps) {
  const { t, tu, language, setLanguage } = useLanguage();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useOverlayBehavior(open, closeMenu, menuRef);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxHeight = Math.min(MENU_MAX_HEIGHT, window.innerHeight - rect.bottom - 20);
    const left = Math.min(Math.max(12, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 12);
    setMenuStyle({ top: rect.bottom + 8, left, maxHeight: Math.max(200, maxHeight) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  // Arrow keys, Home and End move between items, as in a native menu.
  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (items.length === 0) return;
    e.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
    else if (e.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
    items[next]?.focus();
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const pickLanguage = (id: 'el' | 'en') => {
    if (language === id) return;
    setLanguage(id);
    toast.message(id === 'el' ? 'Γλώσσα: Ελληνικά' : 'Language: English');
  };

  const pickTheme = (id: ThemeId) => {
    applyThemeSelection(id, setTheme, language === 'el' ? 'el' : 'en', theme);
  };

  const itemBase = cn(
    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium min-h-8 transition-colors outline-none',
    'focus-visible:ring-2',
    tok.isDark ? 'focus-visible:ring-white/40' : 'focus-visible:ring-accent/40',
  );
  const itemIdle = cn(tok.navInactive, tok.isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50');
  const sectionLabel = cn('px-3 pt-2 pb-1 text-2xs font-bold tracking-wider', tok.muted);
  const divider = cn('my-1.5 border-t', tok.isDark ? 'border-gray-700' : 'border-gray-100');

  const menu =
    open && menuStyle && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="fixed inset-0 z-palette cursor-default bg-black/20 backdrop-blur-[1px]"
              onClick={closeMenu}
            />
            <div
              ref={menuRef}
              tabIndex={-1}
              role="menu"
              aria-label={label}
              onKeyDown={onMenuKeyDown}
              className={cn(
                'fixed z-palette rounded-2xl border p-2 shadow-soft-lg overflow-y-auto overscroll-contain outline-none',
                tok.isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200',
              )}
              style={{ top: menuStyle.top, left: menuStyle.left, width: MENU_WIDTH, maxHeight: menuStyle.maxHeight }}
            >
              {header ? <div className="px-3 pt-1.5 pb-2">{header}</div> : null}

              {showAccountLinks ? (
                <>
                  <button type="button" role="menuitem" data-autofocus className={cn(itemBase, itemIdle)} onClick={() => go('/profile')}>
                    <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                    {t('Προφίλ', 'Profile')}
                  </button>
                  <button type="button" role="menuitem" className={cn(itemBase, itemIdle)} onClick={() => go('/settings')}>
                    <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
                    {t('Ρυθμίσεις', 'Settings')}
                  </button>
                  <div className={divider} role="separator" />
                </>
              ) : null}

              <div role="group" aria-label={t('Γλώσσα', 'Language')}>
                <p className={sectionLabel} aria-hidden="true">{tu('Γλώσσα', 'Language')}</p>
                <div className="grid grid-cols-2 gap-1">
                  {([
                    { id: 'el', label: 'Ελληνικά' },
                    { id: 'en', label: 'English' },
                  ] as const).map((opt, i) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === opt.id}
                      lang={opt.id}
                      data-autofocus={!showAccountLinks && i === 0 ? true : undefined}
                      onClick={() => pickLanguage(opt.id)}
                      className={cn(itemBase, 'justify-center px-2', language === opt.id ? tok.navActive : itemIdle)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={divider} role="separator" />

              <div role="group" aria-label={t('Εμφάνιση', 'Appearance')}>
                <p className={sectionLabel} aria-hidden="true">{tu('Εμφάνιση', 'Appearance')}</p>
                {THEME_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={theme === id}
                    onClick={() => pickTheme(id)}
                    className={cn(itemBase, theme === id ? tok.navActive : itemIdle)}
                  >
                    <span className={cn('h-4 w-4 rounded-full shrink-0 ring-2 ring-white/80', THEME_SWATCH[id])} aria-hidden />
                    <span className="flex-1 truncate">{language === 'el' ? THEME_LABELS[id].el : THEME_LABELS[id].en}</span>
                    {theme === id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center space-x-2 relative group rounded-full outline-none focus-visible:ring-2',
          tok.isDark ? 'focus-visible:ring-white/40' : 'focus-visible:ring-accent/40',
          !children && cn('justify-center px-2.5 py-1.5 rounded-lg min-h-8 min-w-8', tok.chipButton),
        )}
      >
        {children ?? <SlidersHorizontal className="w-4 h-4" aria-hidden />}
      </button>
      {menu}
    </div>
  );
}
