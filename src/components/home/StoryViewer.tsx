import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { el as elLocale } from "date-fns/locale";
import { X, MapPin, Crown, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Event } from "../../types";
import { useLanguage } from "../../lib/i18n";
import { useStore } from "../../store";

const STORY_DURATION_MS = 5000;
const TICK_MS = 50;

interface StoryViewerProps {
  events: Event[];
  startIndex: number;
  onClose: () => void;
}

/** Full-screen, tap-through story viewer (Instagram-style) for the event rail. */
export function StoryViewer({ events, startIndex, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const becomeEventHost = useStore((s) => s.becomeEventHost);

  const goNext = useCallback(() => {
    setProgress(0);
    setIndex((i) => {
      if (i >= events.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [events.length, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Auto-advance with progress bar
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - startedAt) / STORY_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        goNext();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [index, paused, goNext]);

  // Keyboard controls + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [goNext, goPrev, onClose]);

  const event = events[index];
  if (!event) return null;

  const seeksHost =
    !!event.isPlatformEvent &&
    !groups.find((g) => g.eventId === event.id && g.hostId);

  let day = "";
  let mon = "";
  let weekday = "";
  try {
    const d = parseISO(event.date);
    day = format(d, "d");
    mon = format(d, "MMM", { locale: elLocale }).toUpperCase();
    weekday = format(d, "EEEE", { locale: elLocale });
  } catch {
    /* keep empty on invalid date */
  }

  const openEvent = () => {
    onClose();
    navigate(`/events/${event.id}`);
  };

  const handleBecomeHost = () => {
    if (!currentUser) {
      onClose();
      navigate("/login");
      return;
    }
    becomeEventHost(event.id);
    toast.success(
      t("Έγινες ο διοργανωτής της ομάδας! 🎉", "You're now the group's organizer! 🎉"),
    );
    onClose();
    navigate(`/events/${event.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none">
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/55" />

        {/* progress segments */}
        <div className="absolute top-2.5 left-3 right-3 flex gap-1 z-20">
          {events.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width:
                    i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* close */}
        <button
          onClick={onClose}
          aria-label={t("Κλείσιμο", "Close")}
          className="absolute top-6 right-3 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* tap zones (avoid bottom CTA area) */}
        <button
          aria-label={t("Προηγούμενο", "Previous")}
          onClick={goPrev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          className="absolute left-0 top-12 bottom-44 w-1/3 z-10"
        />
        <button
          aria-label={t("Επόμενο", "Next")}
          onClick={goNext}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          className="absolute right-0 top-12 bottom-44 w-1/3 z-10"
        />

        {/* bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2.5 z-20">
          {seeksHost && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold">
              <Crown className="w-3.5 h-3.5" />
              {t("Αναζητά διοργανωτή", "Seeking organizer")}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-white/85 text-[12.5px] font-semibold">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="capitalize">
              {weekday} {day} {mon}
            </span>
          </div>
          <h2 className="text-white text-[20px] font-extrabold leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {event.title}
          </h2>
          {event.locationArea && (
            <div className="flex items-center gap-1.5 text-white/85 text-[13px] font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {event.locationArea}
            </div>
          )}
          <div className="flex gap-2 pt-1.5">
            <button
              onClick={openEvent}
              className="flex-1 bg-white text-gray-900 font-bold rounded-xl py-2.5 text-[13.5px] flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-colors"
            >
              {t("Δες εκδήλωση", "View event")}
              <ChevronRight className="w-4 h-4" />
            </button>
            {seeksHost && (
              <button
                onClick={handleBecomeHost}
                className="flex-1 bg-amber-400 text-amber-950 font-bold rounded-xl py-2.5 text-[13.5px] flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-colors"
              >
                <Crown className="w-4 h-4" />
                {t("Γίνε Διοργανωτής", "Organize")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
