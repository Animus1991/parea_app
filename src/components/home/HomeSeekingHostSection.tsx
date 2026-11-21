import { Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { el as elLocale, enUS as enLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useStore } from '../../store';
import { EventCard } from '../events/EventCard';
import { useDiscoverCardImageDepth } from '../../hooks/useDiscoverCardImageDepth';
import { formatEventPrice, formatLocationArea } from '../../lib/eventDisplay';
import type { Event } from '../../types';
import { cn } from '../../lib/utils';
import { EventCoverImg } from '../common/EventCoverImg';

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
  const { t, language } = useLanguage();
  const cardImage = useDiscoverCardImageDepth();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const becomeEventHost = useStore((s) => s.becomeEventHost);
  const dateLocale = language === 'el' ? elLocale : enLocale;

  if (events.length === 0) return null;

  const takeHost = (eventId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    becomeEventHost(eventId);
    toast.success(t('Έγινες ο διοργανωτής της ομάδας!', "You're now the group's organizer!"));
  };

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
            <h2 className={`text-sm md:text-base font-bold tracking-tight leading-tight ${h.heading}`}>
              {t('Αναζητούν διοργανωτή', 'Looking for an organizer')}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSeekingHostOnly}
          className={`filter-chip shrink-0 text-xs font-bold px-3 rounded-full transition-all duration-200 ${seekingHostOnly ? h.chipActive : h.chipInactive}`}
        >
          {seekingHostOnly
            ? t('Όλες οι εκδηλώσεις', 'All events')
            : `${t('Δες όλες', 'See all')} (${events.length})`}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar md:hidden">
        {events.map((event) => {
          const day = format(parseISO(event.date), 'd');
          const month = format(parseISO(event.date), 'LLL', { locale: dateLocale });
          return (
            <article
              key={event.id}
              className={cn(
                'w-[220px] shrink-0 rounded-2xl overflow-hidden border bg-surface-raised',
                tok.isDark ? 'border-white/10' : 'border-gray-200',
              )}
            >
              <Link to={`/events/${event.id}`} className="block relative h-28">
                <EventCoverImg event={event} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 rounded-lg bg-white/90 px-1.5 py-0.5 text-center leading-tight">
                  <span className="block text-2xs font-bold text-ink-muted">{month}</span>
                  <span className="block text-sm font-bold text-ink">{day}</span>
                </span>
                <span className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-1.5 py-0.5 text-2xs font-bold text-ink">
                  {formatEventPrice(event, language, t('Δωρεάν', 'Free'), t('Δωρεάν', 'Free'))}
                </span>
              </Link>
              <div className="p-2.5 space-y-1.5">
                <h3 className="text-xs font-bold text-ink line-clamp-2">{event.title}</h3>
                <p className="text-xs text-ink-muted truncate">{formatLocationArea(event.locationArea, language)}</p>
                <button
                  type="button"
                  onClick={() => takeHost(event.id)}
                  className="w-full min-h-8 rounded-full bg-amber-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5" aria-hidden />
                  {t('Ανάλαβε τη διοργάνωση', 'Take on hosting')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden md:flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar">
        {events.map((event) => (
          <div key={event.id} className="w-[290px] sm:w-[320px] shrink-0">
            <EventCard event={event} emphasis="host" imageDepth={cardImage.depth} />
          </div>
        ))}
      </div>
    </section>
  );
}
