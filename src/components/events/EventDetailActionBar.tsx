import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Calendar, Bookmark, QrCode, Share, Download, ChevronDown, Newspaper } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import type { EventCalendarAvailability } from '../../lib/eventCalendarExport';

export type EventDetailAccent = 'classic' | 'vibrant' | 'neon' | 'bento';

type AccentTokens = { saved: string; action: string; neutral: string };

const ACCENT_LIGHT: Record<EventDetailAccent, AccentTokens> = {
  classic: {
    saved: 'text-cyan-800 bg-cyan-100',
    action: 'text-cyan-600 hover:text-cyan-800 bg-cyan-50',
    neutral: 'text-gray-600 hover:text-cyan-600 bg-gray-50 hover:bg-gray-100',
  },
  vibrant: {
    saved: 'text-fuchsia-800 bg-fuchsia-100',
    action: 'text-fuchsia-600 hover:text-fuchsia-800 bg-fuchsia-50',
    neutral: 'text-black hover:text-fuchsia-600 bg-gray-50 hover:bg-gray-100',
  },
  neon: {
    saved: 'text-emerald-800 bg-emerald-100',
    action: 'text-emerald-600 hover:text-emerald-800 bg-emerald-50',
    neutral: 'text-black hover:text-emerald-600 bg-gray-50 hover:bg-gray-100',
  },
  bento: {
    saved: 'text-indigo-800 bg-indigo-100',
    action: 'text-indigo-600 hover:text-indigo-800 bg-indigo-50',
    neutral: 'text-black hover:text-indigo-600 bg-gray-50 hover:bg-gray-100',
  },
};

const ACCENT_DARK: Record<EventDetailAccent, AccentTokens> = {
  classic: {
    saved: 'text-cyan-400 bg-cyan-900/50',
    action: 'text-cyan-400 hover:text-cyan-300 bg-cyan-900/30',
    neutral: 'text-white hover:text-cyan-400 bg-gray-800/70 hover:bg-gray-700',
  },
  vibrant: {
    saved: 'text-fuchsia-400 bg-fuchsia-900/50',
    action: 'text-fuchsia-400 hover:text-fuchsia-300 bg-fuchsia-900/30',
    neutral: 'text-white hover:text-fuchsia-400 bg-gray-800/70 hover:bg-gray-700',
  },
  neon: {
    saved: 'text-emerald-400 bg-emerald-900/50',
    action: 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/30',
    neutral: 'text-white hover:text-emerald-400 bg-gray-800/70 hover:bg-gray-700',
  },
  bento: {
    saved: 'text-indigo-400 bg-indigo-900/50',
    action: 'text-indigo-400 hover:text-indigo-300 bg-indigo-900/30',
    neutral: 'text-white hover:text-indigo-400 bg-gray-800/70 hover:bg-gray-700',
  },
};

export interface EventDetailActionBarProps {
  accent: EventDetailAccent;
  /** Dark-themed EventDetail pages (VibrantDark, NeonDark, BentoDark) */
  darkSurface?: boolean;
  isSaved: boolean;
  onSave: () => void;
  onQr: () => void;
  onShare: () => void;
  /** «Στον τοίχο μου» — opens the wall composer with this event attached. */
  onShareToWall?: () => void;
  isCopied: boolean;
  onAddToGoogleCalendar: () => void;
  onDownloadIcs: () => void;
  calendarAvailability?: EventCalendarAvailability;
  className?: string;
}

export function EventDetailActionBar({
  accent,
  isSaved,
  onSave,
  onQr,
  onShare,
  onShareToWall,
  isCopied,
  onAddToGoogleCalendar,
  onDownloadIcs,
  calendarAvailability,
  className,
  darkSurface = false,
}: EventDetailActionBarProps) {
  const { t } = useLanguage();
  const a = (darkSurface ? ACCENT_DARK : ACCENT_LIGHT)[accent];
  const calendarOk = calendarAvailability?.ok !== false;

  const btn = 'flex items-center gap-2 text-2xs font-bold tracking-wider transition-colors px-3 py-1.5 rounded-full';
  const item = 'w-full flex items-center gap-2 text-left text-2xs font-bold tracking-wider px-3 py-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed';

  // Five equal buttons became three: save, share (link + QR), calendar (Google + .ics).
  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
    <div className="flex gap-2 flex-wrap justify-end">
      <button type="button" onClick={onSave} className={cn(btn, isSaved ? a.saved : a.neutral)}>
        <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-current')} />
        {isSaved ? t('Αποθηκεύτηκε', 'Saved') : t('Αποθήκευση Εκδήλωσης', 'Save Event')}
      </button>
      <ActionMenu
        triggerClassName={cn(btn, a.action)}
        icon={<Share className="h-3.5 w-3.5" aria-hidden />}
        label={isCopied ? t('Αντιγράφηκε!', 'Link Copied!') : t('Κοινοποίηση', 'Share Event')}
        darkSurface={darkSurface}
      >
        {(close) => (
          <>
            <button type="button" role="menuitem" className={item} onClick={() => { close(); onShare(); }}>
              <Share className="h-3.5 w-3.5" aria-hidden />
              {t('Αντιγραφή συνδέσμου', 'Copy link')}
            </button>
            <button type="button" role="menuitem" className={item} onClick={() => { close(); onQr(); }}>
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              {t('Κωδικός QR', 'QR Code')}
            </button>
            {onShareToWall && (
              <button type="button" role="menuitem" className={item} onClick={() => { close(); onShareToWall(); }}>
                <Newspaper className="h-3.5 w-3.5" aria-hidden />
                {t('Στον τοίχο μου', 'On my wall')}
              </button>
            )}
          </>
        )}
      </ActionMenu>
      <ActionMenu
        triggerClassName={cn(btn, a.action)}
        icon={<Calendar className="h-3.5 w-3.5" aria-hidden />}
        label={t('Ημερολόγιο', 'Calendar')}
        darkSurface={darkSurface}
      >
        {(close) => (
          <>
            <button type="button" role="menuitem" disabled={!calendarOk} className={item} onClick={() => { close(); onAddToGoogleCalendar(); }}>
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {t('Google Calendar', 'Google Calendar')}
            </button>
            <button type="button" role="menuitem" disabled={!calendarOk} className={item} onClick={() => { close(); onDownloadIcs(); }}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t('Λήψη .ics', 'Download ICS')}
            </button>
          </>
        )}
      </ActionMenu>
    </div>
    {!calendarOk && calendarAvailability && (
      <p className="text-2xs font-medium text-gray-500 text-right max-w-xs">
        {t(calendarAvailability.reasonEl, calendarAvailability.reasonEn)}
      </p>
    )}
    </div>
  );
}

/** Small disclosure menu (button + popover) used to group related secondary actions. */
function ActionMenu({
  triggerClassName,
  icon,
  label,
  darkSurface,
  children,
}: {
  triggerClassName: string;
  icon: ReactNode;
  label: string;
  darkSurface?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    // Move focus to the first item so keyboard users land in the menu.
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {icon}
        {label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-1.5 z-sheet min-w-[11rem] rounded-xl border p-1 shadow-soft-md',
            darkSurface ? 'bg-gray-900 border-white/10 text-gray-100' : 'bg-white border-gray-200 text-gray-800',
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
