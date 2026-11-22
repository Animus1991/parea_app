import { useLanguage } from '../../lib/i18n';
import { getEventDetailSurfaceTokens } from '../../lib/designTokens';
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
  // Φ27 — a route, when there is one, says how hard it really is.
  const routeDifficulty = event.route
    ? { easy: t('Εύκολη', 'Easy'), moderate: t('Μέτρια', 'Moderate'), hard: t('Απαιτητική', 'Hard') }[event.route.difficulty]
    : null;

  return (
    <div
      className={cn(
        'pt-5 border-t mt-5 animate-in fade-in slide-in-from-bottom-2',
        tok.sectionBorder,
        className,
      )}
    >
      <h3 className={cn(tok.sectionHeading, 'mb-3')}>
        {t('Λεπτομέρειες περιπέτειας', 'Adventure Details')}
      </h3>
      {/* Semantic tokens: readable in every theme, light or dark. */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(tok.innerCard, 'border-border bg-surface')}>
          <div className={cn(tok.labelMicro, 'mb-1 text-ink-muted')}>
            {t('Δυσκολία', 'Difficulty')}
          </div>
          <div className="card-heading font-bold text-ink">
            {routeDifficulty
              ? `${routeDifficulty} · ${event.route!.distanceKm.toLocaleString('el-GR')} ${t('χλμ', 'km')}`
              : isHiking
                ? t('Μέτρια / έδαφος', 'Moderate / Terrain')
                : t('Εύκολο / αναψυχή', 'Easy / Leisure')}
          </div>
        </div>
        <div className={cn(tok.innerCard, 'border-border bg-surface')}>
          <div className={cn(tok.labelMicro, 'mb-1 text-ink-muted')}>
            {t('Εξοπλισμός / σημειώσεις', 'Equipment / Notes')}
          </div>
          <div className="card-heading font-bold text-ink">
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
