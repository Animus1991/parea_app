import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface OverflowMenuItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * Accessible «⋯» menu (WAI-ARIA menu button): focus moves into the menu,
 * ↑/↓/Home/End move between items, Escape or Tab closes it and focus
 * returns to the button. Shared by posts and profiles.
 */
export function OverflowMenu({ items, label }: { items: OverflowMenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (items.length === 0) return null;
  itemRefs.current.length = items.length;

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
      list[next]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      list[e.key === 'Home' ? 0 : list.length - 1]?.focus();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-fab mt-1 w-60 rounded-xl border border-border bg-surface-raised py-1 shadow-soft-lg"
        >
          {items.map((it, idx) => (
            <button
              key={it.key}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close();
                it.onSelect();
              }}
              className={cn(
                'flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium hover:bg-surface focus-visible:bg-surface focus-visible:outline-none',
                it.danger ? 'text-red-600 dark:text-red-400' : 'text-ink',
              )}
            >
              <it.icon className="h-4 w-4 shrink-0" aria-hidden /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
