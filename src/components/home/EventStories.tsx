import { useState } from "react";
import { format, parseISO } from "date-fns";
import { el as elLocale, enUS as enLocale } from "date-fns/locale";
import { Crown, Flame } from "lucide-react";
import type { Event } from "../../types";
import { useLanguage } from "../../lib/i18n";
import { useStore } from "../../store";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useHomeTheme } from "../../hooks/useHomeTheme";
import { cn } from "../../lib/utils";
import { isEventSeekingHost } from "../../lib/storyEventOrdering";
import { StoryViewer } from "./StoryViewer";
import { EventCoverImg } from "../common/EventCoverImg";
import { HorizontalScrollArrows } from "../ui/HorizontalScrollArrows";
import { SectionLabel } from "../common/SectionLabel";

const RING_BY_ACCENT: Record<string, string> = {
  cyan: "from-cyan-400 via-teal-400 to-emerald-400",
  fuchsia: "from-fuchsia-500/65 via-pink-500/65 to-orange-400/65",
  indigo: "from-indigo-500 via-violet-500 to-fuchsia-400",
  emerald: "from-emerald-400 via-teal-400 to-cyan-400",
  ab: "from-slate-400 via-slate-500 to-slate-600",
};

const RING_BY_ACCENT_DARK: Record<string, string> = {
  ...RING_BY_ACCENT,
  fuchsia: "from-fuchsia-500/50 via-pink-500/50 to-orange-400/50",
};

interface EventStoriesProps {
  events: Event[];
}

/**
 * Instagram/reels-style horizontal "story" rail of events, shown right under the
 * hero. Saved events render with a muted ring (already-seen feel); platform
 * events seeking a host get a crown badge; trending events get a flame.
 */
export function EventStories({ events }: EventStoriesProps) {
  const { t, language } = useLanguage();
  const groups = useStore((s) => s.groups);
  const savedEvents = useStore((s) => s.savedEvents) || [];
  const tok = useThemeStyles();
  const h = useHomeTheme();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!events.length) return null;

  const ringMap = tok.isDark ? RING_BY_ACCENT_DARK : RING_BY_ACCENT;
  const activeRing = ringMap[tok.accent] ?? ringMap.cyan;

  return (
    <section className="space-y-3" data-event-stories="">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel el="Εκδηλώσεις σε στιγμιότυπα" en="Events in stories" />
        <span className={`text-xs font-semibold ${h.labelMuted}`}>
          {events.length} {t("εκδηλώσεις", "events")}
        </span>
      </div>

      <HorizontalScrollArrows
        itemCount={events.length}
        scrollClassName="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar"
      >
        {events.map((e, idx) => {
          const seeksHost = isEventSeekingHost(e, groups);
          const seen = savedEvents.includes(e.id);
          const badgeLabel = seeksHost
            ? t('Ψάχνει διοργανωτή', 'Looking for a host')
            : e.isTrending
              ? t('Δημοφιλές', 'Trending')
              : '';

          let day = "";
          let mon = "";
          try {
            const d = parseISO(e.date);
            day = format(d, "d");
            mon = format(d, "MMM", { locale: language === 'en' ? enLocale : elLocale });
          } catch {
            /* keep empty on invalid date */
          }

          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setViewerIndex(idx)}
              className="event-story-tile shrink-0 w-[104px] text-left group focus:outline-none focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-brand"
              data-event-story=""
              title={e.title}
              aria-label={[e.title, day && `${day} ${mon}`, badgeLabel].filter(Boolean).join(', ')}
            >
              <div
                className={cn(
                  "p-[2.08px] rounded-2xl bg-gradient-to-tr transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95",
                  seen ? "from-gray-300 to-gray-300" : activeRing,
                )}
              >
                <div className="event-story-tile-frame relative w-full h-[150px] rounded-2xl overflow-hidden bg-gray-200">
                  {/* Same cover logic as the event cards: falls back to the app's own cover offline. */}
                  <EventCoverImg
                    event={e}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* One quiet marker at most: seeking a host wins over trending. */}
                  {badgeLabel ? (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/45 flex items-center justify-center"
                      title={badgeLabel}
                      aria-hidden="true"
                    >
                      {seeksHost ? (
                        <Crown className="w-3 h-3 text-amber-300" />
                      ) : (
                        <Flame className="w-3 h-3 text-rose-300" />
                      )}
                    </div>
                  ) : null}

                  {/* Date and title share one text block at the bottom, no boxed chip on top. */}
                  <div
                    data-event-story-caption=""
                    className="absolute bottom-1.5 left-1.5 right-1.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  >
                    {day ? (
                      <span className="block text-2xs font-bold leading-tight text-white/85">
                        {day} {mon}
                      </span>
                    ) : null}
                    <span className="block text-2xs font-bold leading-tight line-clamp-2">
                      {e.title}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </HorizontalScrollArrows>

      {viewerIndex !== null && (
        <StoryViewer
          events={events}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </section>
  );
}
