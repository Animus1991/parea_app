import { Calendar, Bookmark, QrCode, Share } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

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
  isCopied: boolean;
  onAddToCalendar: () => void;
  className?: string;
}

export function EventDetailActionBar({
  accent,
  isSaved,
  onSave,
  onQr,
  onShare,
  isCopied,
  onAddToCalendar,
  className,
  darkSurface = false,
}: EventDetailActionBarProps) {
  const { t } = useLanguage();
  const a = (darkSurface ? ACCENT_DARK : ACCENT_LIGHT)[accent];

  const btn = 'flex items-center gap-2 text-[10px] font-bold tracking-wider transition-colors px-3 py-1.5 rounded-full';

  return (
    <div className={cn('flex gap-2 flex-wrap justify-end', className)}>
      <button type="button" onClick={onSave} className={cn(btn, isSaved ? a.saved : a.neutral)}>
        <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-current')} />
        {isSaved ? t('Αποθηκεύτηκε', 'Saved') : t('Αποθήκευση Εκδήλωσης', 'Save Event')}
      </button>
      <button type="button" onClick={onQr} className={cn(btn, a.action)}>
        <QrCode className="h-3.5 w-3.5" />
        {t('Κωδικός QR', 'QR Code')}
      </button>
      <button type="button" onClick={onShare} className={cn(btn, a.action)}>
        <Share className="h-3.5 w-3.5" />
        {isCopied ? t('Αντιγράφηκε!', 'Link Copied!') : t('Κοινοποίηση', 'Share Event')}
      </button>
      <button type="button" onClick={onAddToCalendar} className={cn(btn, a.neutral)}>
        <Calendar className="h-3.5 w-3.5" />
        {t('Προσθήκη στο Ημερολόγιο', 'Add to Calendar')}
      </button>
    </div>
  );
}
