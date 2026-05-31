import { Crown } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { EventCard } from '../events/EventCard';
import type { Event } from '../../types';

export interface HomeSeekingHostSectionProps {
  events: Event[];
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
}

export function HomeSeekingHostSection({
  events,
  seekingHostOnly,
  onToggleSeekingHostOnly,
}: HomeSeekingHostSectionProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const tok = useThemeStyles();

  if (events.length === 0) return null;

  return (
    <section
      className={`rounded-2xl p-4 space-y-3.5 border ${tok.isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/70 border-amber-200/70'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h2 className={`text-[14.63px] font-bold leading-tight ${h.heading}`}>
              {t('Αναζητούν διοργανωτή', 'Looking for an organizer')}
            </h2>
            <p className={`text-[12px] font-medium mt-0.5 ${h.labelMuted}`}>
              {t(
                'Εκδηλώσεις από το Nakamas — γίνε εσύ ο διοργανωτής της παρέας.',
                'Events by Nakamas — step up and organize the group.',
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSeekingHostOnly}
          className={`shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${seekingHostOnly ? h.chipActive : h.chipInactive}`}
        >
          {seekingHostOnly
            ? t('Όλες οι εκδηλώσεις', 'All events')
            : `${t('Δες όλες', 'See all')} (${events.length})`}
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar">
        {events.map((event) => (
          <div key={event.id} className="w-[290px] sm:w-[320px] shrink-0">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}
