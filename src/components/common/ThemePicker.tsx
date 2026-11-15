import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { THEME_IDS, THEME_LABELS, THEME_SWATCH, type ThemeId } from '../../lib/themes';
import { applyThemeSelection } from '../../lib/applyTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { cn } from '../../lib/utils';

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 360;

interface ThemePickerProps {
  variant?: 'compact' | 'grid';
}

export function ThemePicker({ variant = 'grid' }: ThemePickerProps) {
  const { t, tu, language } = useLanguage();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const tok = useThemeStyles();
  const [open, setOpen] = useState(false);

  const applyTheme = (id: ThemeId) => {
    applyThemeSelection(id, setTheme, language === 'el' ? 'el' : 'en', theme);
  };
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useOverlayBehavior(open, closeMenu, menuRef);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      MENU_MAX_HEIGHT,
      openUp ? spaceAbove : spaceBelow,
    );
    const top = openUp
      ? rect.top - maxHeight - 8
      : rect.bottom + 8;
    const left = Math.min(
      Math.max(12, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 12,
    );
    setMenuStyle({ top, left, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  if (variant === 'compact') {
    const menu =
      open && menuStyle && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-palette cursor-default bg-black/20 backdrop-blur-[1px]"
                onClick={closeMenu}
                aria-label={t('Κλείσιμο', 'Close')}
              />
              <div
                ref={menuRef}
                tabIndex={-1}
                role="listbox"
                aria-label={t('Επιλογή θέματος', 'Choose theme')}
                className={cn(
                  'fixed z-palette rounded-2xl border p-2 shadow-soft-lg overflow-y-auto overscroll-contain outline-none',
                  tok.isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200',
                )}
                style={{
                  top: menuStyle.top,
                  left: menuStyle.left,
                  width: MENU_WIDTH,
                  maxHeight: menuStyle.maxHeight,
                }}
              >
                <p
                  className={cn(
                    'px-3 py-2 text-2xs font-bold uppercase tracking-wider',
                    tok.muted,
                  )}
                >
                  {tu('Εμφάνιση', 'Appearance')}
                </p>
                {THEME_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={theme === id}
                    onClick={() => {
                      applyTheme(id);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium min-h-11 transition-colors',
                      theme === id
                        ? tok.navActive
                        : cn(
                            tok.navInactive,
                            tok.isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
                          ),
                    )}
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full shrink-0 ring-2 ring-white/80',
                        THEME_SWATCH[id],
                      )}
                    />
                    <span className="flex-1 truncate">
                      {language === 'el' ? THEME_LABELS[id].el : THEME_LABELS[id].en}
                    </span>
                    {theme === id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                  </button>
                ))}
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
          className={cn(
            'flex items-center gap-1.5 text-xs font-bold transition-colors px-2.5 py-2 rounded-lg min-h-11',
            tok.chipButton,
            open && (tok.isDark ? 'ring-2 ring-white/30' : 'ring-2 ring-accent/40'),
          )}
          title={t('Εμφάνιση και θέμα', 'Appearance and theme')}
          aria-label={t('Εμφάνιση και θέμα', 'Appearance and theme')}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span className="hidden 2xl:inline max-w-[88px] truncate">
            {language === 'el'
              ? THEME_LABELS[theme as ThemeId]?.el ?? theme
              : THEME_LABELS[theme as ThemeId]?.en ?? theme}
          </span>
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {THEME_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => applyTheme(id)}
          aria-pressed={theme === id}
          className={cn(
            'flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all min-h-10',
            theme === id
              ? cn(
                  'ring-2',
                  tok.isDark
                    ? 'border-cyan-400/60 ring-cyan-400/25 bg-white/5'
                    : 'border-accent ring-accent/30 bg-cyan-50/50',
                )
              : tok.isDark
                ? 'border-gray-700 hover:border-gray-600'
                : 'border-gray-100 hover:border-gray-200',
          )}
        >
          <span
            className={cn(
              'h-6 w-6 rounded-full shrink-0 ring-2 ring-white shadow-soft',
              THEME_SWATCH[id],
            )}
          />
          <span className={cn('text-xs font-bold leading-tight', tok.head)}>
            {language === 'el' ? THEME_LABELS[id].el : THEME_LABELS[id].en}
          </span>
        </button>
      ))}
    </div>
  );
}
