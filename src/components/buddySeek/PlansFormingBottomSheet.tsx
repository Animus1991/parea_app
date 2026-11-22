import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useContrastTheme } from '../../hooks/useContrastTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { useStore } from '../../store';
import { MiniOutingsSection } from '../outings/MiniOutingsSection';
import { DiscoverCardImagePicker } from '../home/DiscoverCardImagePicker';
import { useDiscoverCardImageDepth } from '../../hooks/useDiscoverCardImageDepth';
import { cn } from '../../lib/utils';

/**
 * Last-minute nearby outings — not My Plans, not the event Find-company page.
 * Those two pages already list different things; this sheet must not clone them.
 */
export function PlansFormingBottomSheet() {
  const open = useStore((s) => s.plansFormingSheetOpen);
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { t } = useLanguage();
  const c = useContrastTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const cardImage = useDiscoverCardImageDepth();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayBehavior(open, () => setOpen(false), panelRef);

  const leave = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-sheet" role="dialog" aria-modal="true" aria-labelledby="plans-forming-sheet-title">
      <button
        type="button"
        className={cn('absolute inset-0 backdrop-blur-sm', c.modalOverlay)}
        onClick={() => setOpen(false)}
        aria-label={t('Κλείσιμο', 'Close')}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[92vh] flex flex-col overflow-hidden rounded-t-3xl border-t shadow-soft-lg animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none outline-none',
          'md:left-1/2 md:right-auto md:w-[min(100%-2rem,36rem)] md:-translate-x-1/2 md:bottom-8 md:max-h-[min(92vh,40rem)] md:rounded-3xl md:border',
          c.modalPanel,
        )}
      >
        <div className={cn('mx-auto mt-3 mb-1 h-1 w-10 rounded-full shrink-0', tok.isDark ? 'bg-gray-500' : 'bg-gray-300')} />

        <div className="px-5 pt-2 pb-3 border-b border-inherit shrink-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 id="plans-forming-sheet-title" className={cn('text-sm md:text-base font-bold', tok.head)}>
                {t('Βρες παρέα τώρα', 'Find company now')}
              </h2>
              <p className={cn('text-xs font-medium leading-relaxed', tok.isDark ? 'text-gray-400' : 'text-ink-muted')}>
                {t(
                  'Σύντομες έξοδοι δίπλα σου — καφές, βόλτα, τρέξιμο — χωρίς να κλείσεις εκδήλωση. Τα βράδια που έχεις ήδη κλείσει είναι στα Σχέδιά σου.',
                  'Short outings next to you — coffee, a walk, a run — without booking an event. Nights you already booked live in My Plans.',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn('rounded-full p-2 min-h-8 min-w-8 flex items-center justify-center shrink-0', tok.chipButton)}
              aria-label={t('Κλείσιμο', 'Close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          data-plans-sheet-scroll=""
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3 space-y-4 pb-32"
        >
          <DiscoverCardImagePicker
            depth={cardImage.depth}
            options={cardImage.options}
            onChange={cardImage.setDepth}
          />
          <MiniOutingsSection variant="sheet" onLeave={() => setOpen(false)} imageDepth={cardImage.depth} />
        </div>

        <div
          className={cn(
            'sticky bottom-0 left-0 right-0 px-4 py-2.5 border-t flex flex-wrap gap-2 shrink-0 backdrop-blur-md',
            tok.isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200',
          )}
        >
          <button
            type="button"
            onClick={() => leave('/buddy-seek')}
            className={cn('flex-1 min-h-9 rounded-full text-xs font-bold text-white', tok.primaryBtn)}
          >
            {t('Βρες παρέα για εκδήλωση', 'Find company for an event')}
          </button>
          <button
            type="button"
            onClick={() => leave('/plans')}
            className={cn('min-h-9 px-4 rounded-full text-xs font-bold border', c.border, c.fgMuted)}
          >
            {t('Τα σχέδιά μου', 'My plans')}
          </button>
        </div>
      </div>
    </div>
  );
}
