import { KeyboardEvent, useRef, type ElementType } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { isDarkTheme } from '../../lib/themes';

export interface TabBarTab {
  id: string;
  label: string;
  count?: number;
  /** Optional lucide icon (ported from the nakamas segmented tabs). */
  icon?: ElementType;
}

interface TabBarProps {
  tabs: TabBarTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  /** Accessible name of the tab list. */
  ariaLabel?: string;
  /** Id prefix that links tabs to panels (`${idBase}-panel-${id}`) when panels set the matching id. */
  idBase?: string;
  /**
   * `pill` (default) keeps the original look; `segmented` is the compact
   * progressive-disclosure control used for page sections (Profile, Admin, Trust…).
   */
  variant?: 'pill' | 'segmented';
}

/**
 * Accessible tabs (WAI-ARIA Authoring Practices): role=tablist/tab,
 * aria-selected, roving tabindex, ←/→/Home/End keyboard navigation.
 */
export function TabBar({ tabs, activeTab, onChange, className, ariaLabel, idBase, variant = 'pill' }: TabBarProps) {
  const theme = useStore((state) => state.theme);
  const isDark = isDarkTheme(theme);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const getActiveClass = () =>
    isDark
      ? 'border border-gray-400/70 text-gray-100 bg-gray-700/50 rounded-full px-3 py-1.5 min-h-8 font-bold transition-all duration-200 inline-flex items-center'
      : 'btn-pill-active inline-flex items-center min-h-8';

  const getInactiveClass = () =>
    isDark
      ? 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full px-3 py-1.5 min-h-8 font-semibold transition-all duration-200 inline-flex items-center'
      : 'btn-pill-inactive inline-flex items-center min-h-8';

  const getActiveCountClass = () => (isDark ? 'bg-gray-500 text-white' : 'bg-gray-600 text-white');
  const getInactiveCountClass = () => (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600');

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusTab(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusTab(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  const segmented = variant === 'segmented';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        segmented
          ? 'inline-flex max-w-full gap-1 overflow-x-auto noscrollbar rounded-2xl border border-border bg-surface-raised p-1'
          : 'flex gap-1 overflow-x-auto noscrollbar',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const selected = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={idBase ? `${idBase}-tab-${tab.id}` : undefined}
            aria-selected={selected}
            aria-controls={idBase ? `${idBase}-panel-${tab.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              segmented
                ? cn(
                    'inline-flex min-h-8 items-center gap-1 rounded-xl px-3 text-xs font-semibold transition-colors',
                    selected ? 'bg-accent text-accent-fg shadow-soft' : 'text-ink-muted hover:bg-surface hover:text-ink',
                  )
                : cn('text-xs', selected ? getActiveClass() : getInactiveClass()),
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-2xs font-bold px-1 tabular-nums',
                  segmented
                    ? selected
                      ? 'bg-white/25 text-current'
                      : 'bg-surface text-ink-muted'
                    : selected
                      ? getActiveCountClass()
                      : getInactiveCountClass(),
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
