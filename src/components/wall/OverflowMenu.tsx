import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface OverflowMenuItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/** Accessible «⋯» menu (Escape / outside click close it). Shared by posts and profiles. */
export function OverflowMenu({ items, label }: { items: OverflowMenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-fab mt-1 w-60 rounded-xl border border-border bg-surface-raised py-1 shadow-soft-lg">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className={cn(
                'flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium hover:bg-surface',
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
