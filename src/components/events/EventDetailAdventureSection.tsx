import { useLanguage } from '../../lib/i18n';
import { getEventDetailSurfaceTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

const ADVENTURE_CATEGORIES = new Set(['Hiking', 'Nearby escapes']);

export interface EventDetailAdventureSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailAdventureSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailAdventureSectionProps) {
  const { t } = useLanguage();
  const tok = getEventDetailSurfaceTokens(accent, darkSurface);

  if (!ADVENTURE_CATEGORIES.has(event.category)) return null;

  const isHiking = event.category === 'Hiking';

  return (
    <div
      className={cn(
        'pt-5 border-t mt-5 animate-in fade-in slide-in-from-bottom-2',
        tok.sectionBorder,
        className,
      )}
    >
      <h3 className={cn(tok.sectionHeading, 'mb-3')}>
        {t('Λεπτομέρειες Περιπέτειας', 'Adventure Details')}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div
          className={cn(
            tok.innerCard,
            darkSurface
              ? 'bg-emerald-950/40 border-emerald-900'
              : 'bg-emerald-50/50 border-emerald-100',
          )}
        >
          <div className={cn(tok.labelMicro, 'text-emerald-700 mb-1', darkSurface && 'text-emerald-400')}>
            {t('Δυσκολία', 'Difficulty')}
          </div>
          <div className={cn('text-sm font-bold', darkSurface ? 'text-white' : 'text-gray-900')}>
            {isHiking
              ? t('Μέτρια / Έδαφος', 'Moderate / Terrain')
              : t('Εύκολο / Αναψυχή', 'Easy / Leisure')}
          </div>
        </div>
        <div
          className={cn(
            tok.innerCard,
            darkSurface
              ? 'bg-amber-950/30 border-amber-900'
              : 'bg-amber-50/50 border-amber-100',
          )}
        >
          <div className={cn(tok.labelMicro, 'text-amber-700 mb-1', darkSurface && 'text-amber-400')}>
            {t('Εξοπλισμός / Σημειώσεις', 'Equipment / Notes')}
          </div>
          <div className={cn('text-sm font-bold', darkSurface ? 'text-white' : 'text-gray-900')}>
            {isHiking
              ? t(
                  'Απαιτούνται μποτάκια πεζοπορίας. Φέρτε νερό.',
                  'Hiking boots required. Bring water.',
                )
              : t(
                  'Διανυκτέρευση. Μοιρασμένα έξοδα.',
                  'Overnight stay. Shared expenses.',
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
