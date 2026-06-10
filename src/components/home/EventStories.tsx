import { useState } from "react";
import { format, parseISO } from "date-fns";
import { el as elLocale } from "date-fns/locale";
import { Crown, Flame } from "lucide-react";
import type { Event } from "../../types";
import { useLanguage } from "../../lib/i18n";
import { useStore } from "../../store";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { useHomeTheme } from "../../hooks/useHomeTheme";
import { cn } from "../../lib/utils";
import { isEventSeekingHost } from "../../lib/storyEventOrdering";
import { StoryViewer } from "./StoryViewer";
import { HorizontalScrollArrows } from "../ui/HorizontalScrollArrows";

const RING_BY_ACCENT: Record<string, string> = {
  cyan: "from-cyan-400 via-teal-400 to-emerald-400",
  fuchsia: "from-fuchsia-500 via-pink-500 to-orange-400",
  indigo: "from-indigo-500 via-violet-500 to-fuchsia-400",
  emerald: "from-emerald-400 via-teal-400 to-cyan-400",
  ab: "from-slate-400 via-slate-500 to-slate-600",
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
  const { t } = useLanguage();
  const groups = useStore((s) => s.groups);
  const savedEvents = useStore((s) => s.savedEvents) || [];
  const tok = useThemeStyles();
  const h = useHomeTheme();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!events.length) return null;

  const activeRing = RING_BY_ACCENT[tok.accent] ?? RING_BY_ACCENT.cyan;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className={`text-[11.6px] font-bold uppercase tracking-wide ${h.sectionLabel}`}>
          {t("Εκδηλώσεις σε στιγμιότυπα", "Events in stories")}
        </h2>
        <span className={`text-[11px] font-semibold ${h.labelMuted}`}>
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

          let day = "";
          let mon = "";
          try {
            const d = parseISO(e.date);
            day = format(d, "d");
            mon = format(d, "MMM", { locale: elLocale }).toUpperCase();
          } catch {
            /* keep empty on invalid date */
          }

          return (
            <button
              key={e.id}
              onClick={() => setViewerIndex(idx)}
              className="shrink-0 w-[104px] text-left group focus:outline-none"
              title={e.title}
            >
              <div
                className={cn(
                  "p-[2.5px] rounded-[20px] bg-gradient-to-tr transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95",
                  seen ? "from-gray-300 to-gray-300" : activeRing,
                )}
              >
                <div className="relative w-full h-[150px] rounded-[18px] overflow-hidden bg-gray-200">
                  {e.imageUrl ? (
                    <img
                      src={e.imageUrl}
                      alt={e.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* date chip */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col items-center bg-white/95 rounded-lg px-1.5 py-0.5 leading-none shadow-soft">
                    <span className="text-[8.5px] font-extrabold uppercase text-[#0E8B8D] leading-none">
                      {mon}
                    </span>
                    <span className="text-[12px] font-black text-gray-900 leading-none">
                      {day}
                    </span>
                  </div>

                  {/* badges */}
                  {seeksHost ? (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-soft">
                      <Crown className="w-3 h-3 text-amber-900" />
                    </div>
                  ) : e.isTrending ? (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shadow-soft">
                      <Flame className="w-3 h-3 text-white" />
                    </div>
                  ) : null}

                  <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[10.5px] font-bold leading-tight line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {e.title}
                  </p>
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
