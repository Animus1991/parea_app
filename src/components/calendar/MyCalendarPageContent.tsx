import React, { useState } from "react";
import {
  Calendar as ChevronLeft,
  ChevronRight,
  Download,
  CalendarCheck,
  CalendarClock,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { el as elLocale, enUS } from "date-fns/locale";
import { pressable } from "../../lib/a11y";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../../store";
import { useLanguage } from "../../lib/i18n";
import { usePageContrast } from "../../hooks/usePageContrast";
import { useUserCalendarEvents } from "../../hooks/useUserCalendarEvents";
import { useEventsResource } from "../../hooks/useEventsQuery";
import { EmptyState } from "../common/EmptyState";
import { EventCardSkeleton } from "../common/Skeleton";
import { ResourceStateGate } from "../common/ResourceStateGate";
import { cn } from "../../lib/utils";
import { useCalendarDayInteraction } from "../../hooks/useCalendarDayInteraction";
import { sortEventsForStories } from "../../lib/storyEventOrdering";
import { downloadCalendarIcs } from "../../lib/calendarIcs";
import { StoryViewer } from "../home/StoryViewer";
import { CalendarHourlySchedule } from "./CalendarHourlySchedule";
import type { Event } from "../../types";

export default function MyCalendarPageContent() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === "el" ? elLocale : enUS;
  const p = usePageContrast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [dayStoryEvents, setDayStoryEvents] = useState<Event[] | null>(null);
  const [dayStoryDay, setDayStoryDay] = useState<Date | null>(null);
  const [hourlyViewDay, setHourlyViewDay] = useState<Date | null>(null);

  const groups = useStore((state) => state.groups);
  const { upcomingEvents } = useUserCalendarEvents();
  const { isLoading, isError, refetch } = useEventsResource();

  const { handleCellClick } = useCalendarDayInteraction(
    (day, dayEvents) => {
      const list = dayEvents as typeof upcomingEvents;
      if (list.length > 0) {
        setDayStoryDay(day);
        setDayStoryEvents(sortEventsForStories(list, groups));
      }
    },
    (day) => setHourlyViewDay(day),
  );

  const prevPeriod = () =>
    view === "week"
      ? setCurrentDate(subWeeks(currentDate, 1))
      : setCurrentDate(subMonths(currentDate, 1));
  const nextPeriod = () =>
    view === "week"
      ? setCurrentDate(addWeeks(currentDate, 1))
      : setCurrentDate(addMonths(currentDate, 1));

  const handleExportICS = () => {
    downloadCalendarIcs(
      upcomingEvents.map((e) => ({
        title: e.title,
        date: e.date,
        time: e.time,
        locationArea: e.locationArea,
      })),
      "parea-calendar.ics",
    );
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const renderDayCell = (day: Date, isCurrentPeriod: boolean) => {
    const dayEvents = upcomingEvents.filter((e) =>
      isSameDay(e.parsedDate, day),
    );
    return (
      <div
        key={day.toISOString()}
        {...(isCurrentPeriod ? pressable<HTMLDivElement>(() => handleCellClick(day, dayEvents)) : {})}
        aria-label={`${format(day, "EEEE d MMMM", { locale: dateLocale })}${dayEvents.length ? ` · ${dayEvents.length} ${t("εκδηλώσεις", "events")}` : ""}`}
        className={cn(
          "relative min-h-[140px] md:min-h-0 md:aspect-[3/4] lg:aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl cursor-pointer transition-all border overflow-hidden",
          isToday(day)
            ? p.isAB
              ? "bg-[hsl(220_16%_22%)] text-white border-[hsl(220_13%_30%)] shadow-soft"
              : "bg-cyan-600 text-white border-cyan-600 shadow-soft-md shadow-cyan-600/20"
            : dayEvents.length > 0
              ? p.isDark
                ? "bg-cyan-900/20 border-cyan-800/50 hover:bg-cyan-900/40"
                : "bg-cyan-50 border-cyan-100 hover:bg-cyan-100"
              : p.isDark
                ? "bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)] hover:bg-white/5"
                : "bg-white border-gray-100 hover:bg-gray-50",
          !isCurrentPeriod && "opacity-30 pointer-events-none",
        )}
      >
        {dayEvents.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHourlyViewDay(day);
            }}
            className={cn(
              "absolute top-1.5 right-1.5 z-20 p-1 rounded-lg min-h-8 min-w-8 flex items-center justify-center",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
              "bg-black/40 hover:bg-black/55 text-white",
            )}
            aria-label={t("Ημερήσιο πρόγραμμα", "Daily schedule")}
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </button>
        )}
        {dayEvents.length > 0 && (
          <div className="hidden md:block absolute inset-0 z-0">
            {dayEvents.length === 1 && (
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage: `url(${dayEvents[0].imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate font-bold">
                    {dayEvents[0].title}
                  </p>
                  <p className="text-xs text-white/80 truncate">
                    {dayEvents[0].time} • {dayEvents[0].locationArea}
                  </p>
                </div>
              </div>
            )}
            {dayEvents.length === 2 && (
              <>
                <div
                  className="absolute inset-0 border-l border-white/20"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                    backgroundImage: `url(${dayEvents[0].imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-1 right-1 max-w-[60%] text-right">
                    <p className="text-xs text-white truncate font-bold">
                      {dayEvents[0].title}
                    </p>
                    <p className="text-2xs text-white/80 truncate">
                      {dayEvents[0].time}
                    </p>
                  </div>
                </div>
                <div
                  className="absolute inset-0 border-r border-white/20"
                  style={{
                    clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                    backgroundImage: `url(${dayEvents[1].imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute bottom-1 left-1 max-w-[60%] text-left">
                    <p className="text-xs text-white truncate font-bold">
                      {dayEvents[1].title}
                    </p>
                    <p className="text-2xs text-white/80 truncate">
                      {dayEvents[1].time}
                    </p>
                  </div>
                </div>
              </>
            )}
            {dayEvents.length === 3 && (
              <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                {dayEvents.map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative overflow-hidden border-b border-black/30 shadow-inner",
                      i === 0 ? "col-span-2" : "col-span-1 border-r last:border-r-0"
                    )}
                    style={{
                      backgroundImage: `url(${ev.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      className="absolute inset-x-0 bottom-0 px-1 py-0.5"
                      style={{
                        background:
                          "linear-gradient(transparent, rgba(0,0,0,0.8))",
                      }}
                    >
                      <p className="text-xs text-white truncate font-bold leading-tight">
                        {ev.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dayEvents.length === 4 && (
              <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                {dayEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden border-r border-b border-black/30 shadow-inner"
                    style={{
                      backgroundImage: `url(${ev.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      className="absolute inset-x-0 bottom-0 px-1 py-0.5"
                      style={{
                        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                      }}
                    >
                      <p className="text-2xs text-white truncate font-bold leading-tight">
                        {ev.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dayEvents.length >= 5 && (
              <div className="w-full h-full flex flex-wrap">
                {dayEvents.slice(0, 5).map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative overflow-hidden border-r border-b border-black/30 shadow-inner",
                      dayEvents.length === 5 && i < 2 ? "w-1/2 h-1/3" : 
                      dayEvents.length === 5 ? "w-1/3 h-[66.66%]" : "w-1/3 h-1/2"
                    )}
                    style={{
                      backgroundImage: `url(${ev.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-x-0 bottom-0 px-1 py-px" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                      <p className="text-xs text-white truncate font-bold leading-tight">
                        {ev.title}
                      </p>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 5 && (
                  <div className="w-1/3 h-1/2 flex items-center justify-center bg-cyan-900 border-r border-b border-black/30 shadow-inner">
                    <span className="text-white font-bold text-xs drop-shadow-soft-md">+{dayEvents.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <span
          className={cn(
            "relative z-10 text-sm md:text-base font-black",
            isToday(day) || dayEvents.length > 0
              ? "text-white drop-shadow-soft-md"
              : p.head,
          )}
        >
          {format(day, "d")}
        </span>

        {dayEvents.length > 0 && (
          <div className="md:hidden relative z-10 flex items-center justify-center bg-amber-500 text-white rounded-full w-[18px] h-[18px] text-xs font-bold mt-1 shadow-soft">
            {dayEvents.length}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 md:space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-white/5 pb-4 md:pb-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-soft border",
              p.isDark
                ? "bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]"
                : "bg-white border-gray-100",
            )}
          >
            <CalendarCheck className={cn("w-7 h-7", p.iconAccent)} />
          </div>
          <div>
            <h1
              className={cn(
                "text-sm md:text-base font-extrabold tracking-tight",
                p.head,
              )}
            >
              {t("Το Ημερολόγιό μου", "My Calendar")}
            </h1>
            <p className={cn("text-sm font-medium mt-1", p.sub)}>
              {t("Διαχειριστείτε το πρόγραμμά σας", "Manage your schedule")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {upcomingEvents.length > 0 && (
            <button
              onClick={handleExportICS}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                p.cardSurface,
                p.borderB,
                p.cardHover,
                p.head,
              )}
              title={t("Εξαγωγή ως .ics", "Export as .ics")}
            >
              <Download className={cn("w-4 h-4", p.iconAccent)} />
              {t("Εξαγωγή", "Export")}
            </button>
          )}
          <div
            className={cn(
              "flex p-1 rounded-xl border relative shadow-soft",
              p.isDark
                ? "bg-[hsl(220_16%_12%)] border-[hsl(220_13%_22%)]"
                : "bg-gray-100 border-gray-200",
            )}
          >
            <div
              className={cn(
                "absolute inset-y-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out shadow-soft",
                view === "week" ? "left-1" : "left-[calc(50%+2px)]",
                p.isDark && p.isAB
                  ? "bg-[hsl(220_16%_22%)] shadow-[inset_0_1px_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.4)]"
                  : "bg-white dark:bg-gray-800",
              )}
            />
            <button
              className={cn(
                "relative z-10 px-5 py-2 text-xs font-bold transition-all duration-200 select-none",
                view === "week" ? p.head : p.muted,
              )}
              onClick={() => setView("week")}
            >
              {t("Εβδομάδα", "Week")}
            </button>
            <button
              className={cn(
                "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-200 select-none",
                view === "month" ? p.head : p.muted,
              )}
              onClick={() => setView("month")}
            >
              {t("Μήνας", "Month")}
            </button>
          </div>
        </div>
      </div>

      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <EventCardSkeleton key={`cal-sk-${i}`} />
            ))}
          </div>
        }
        errorTitle={t("Αδυναμία φόρτωσης ημερολογίου", "Could not load calendar")}
      >
      {upcomingEvents.length === 0 && (
        <EmptyState
          icon={Compass}
          title={t("Δεν έχετε προγραμματισμένες εκδηλώσεις", "No planned events yet")}
          description={t(
            "Εξερευνήστε εκδηλώσεις και μπείτε σε ομάδα — θα εμφανίζονται στο ημερολόγιο.",
            "Explore events and join a group — they will show on your calendar.",
          )}
          actionLabel={t("Εξερεύνησε εκδηλώσεις", "Explore experiences")}
          onAction={() => navigate("/")}
        />
      )}
      </ResourceStateGate>

      <div
        className={cn(
          "rounded-2xl border overflow-hidden shadow-soft",
          p.cardSurface,
          p.borderB,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 py-5 md:px-5 border-b",
            p.borderB,
          )}
        >
          <h2
            className={cn(
              "font-extrabold text-sm md:text-base tracking-tight capitalize",
              p.head,
            )}
          >
            {format(currentDate, "LLLL yyyy", { locale: dateLocale })}
          </h2>
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={prevPeriod}
              className={cn(
                "p-2 rounded-xl transition-colors",
                p.isDark ? "hover:bg-white/10" : "hover:bg-black/5",
              )}
              aria-label={t("Προηγούμενη", "Previous")}
            >
              <ChevronLeft className={cn("w-5 h-5", p.head)} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-soft border",
                p.isDark
                  ? "bg-[hsl(220_14%_12%)] border-white/5 text-gray-300 hover:bg-[hsl(220_14%_16%)]"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
              )}
            >
              {t("Σήμερα", "Today")}
            </button>
            <button
              onClick={nextPeriod}
              className={cn(
                "p-2 rounded-xl transition-colors",
                p.isDark ? "hover:bg-white/10" : "hover:bg-black/5",
              )}
              aria-label={t("Επόμενη", "Next")}
            >
              <ChevronRight className={cn("w-5 h-5", p.head)} />
            </button>
          </div>
        </div>

        <p className={cn("text-xs font-medium px-4 md:px-5 py-2 border-b", p.borderB, p.muted)}>
          {t(
            "Πάτημα: προεπισκόπηση · Διπλό πάτημα: ωριαίο πρόγραμμα",
            "Tap: preview · Double-tap: hourly schedule",
          )}
        </p>

        <AnimatePresence mode="wait">
          {view === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-5"
            >
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
                {[
                  t("Δευ", "Mon"),
                  t("Τρι", "Tue"),
                  t("Τετ", "Wed"),
                  t("Πεμ", "Thu"),
                  t("Παρ", "Fri"),
                  t("Σαβ", "Sat"),
                  t("Κυρ", "Sun"),
                ].map((d, i) => (
                  <div key={i} className="text-center group cursor-default">
                    <div
                      className={cn(
                        "text-xs md:text-xs font-bold uppercase tracking-widest mb-1 transition-colors",
                        isToday(days[i]) ? p.iconAccent : p.muted,
                      )}
                    >
                      {d}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                {days.map((day) => renderDayCell(day, true))}
              </div>
            </motion.div>
          )}

          {view === "month" && (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-5"
            >
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
                {[
                  t("Δευ", "Mon"),
                  t("Τρι", "Tue"),
                  t("Τετ", "Wed"),
                  t("Πεμ", "Thu"),
                  t("Παρ", "Fri"),
                  t("Σαβ", "Sat"),
                  t("Κυρ", "Sun"),
                ].map((d) => (
                  <div
                    key={d}
                    className={cn(
                      "text-center text-xs md:text-xs font-bold uppercase tracking-widest py-2 rounded-lg",
                      p.isDark
                        ? "bg-white/5 text-gray-400"
                        : "bg-gray-50 text-gray-500",
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div
                    key={`blank-${i}`}
                    className={cn(
                      "aspect-square rounded-xl",
                      p.isDark ? "bg-black/10" : "bg-gray-50/50",
                    )}
                  />
                ))}

                {monthDays.map((day) =>
                  renderDayCell(day, isSameMonth(day, currentDate)),
                )}
              </div>

              {/* Upcoming events list below the grid */}
              {upcomingEvents.length > 0 && (
                <div className={cn("mt-5 border-t pt-4 space-y-3", p.borderB)}>
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest pl-1 mb-4",
                      p.head,
                    )}
                  >
                    {t("Προσεχώς αυτόν τον μήνα", "Upcoming This Month")}
                  </h4>
                  {upcomingEvents.map((event, idx) => (
                    <div
                      key={idx}
                      {...pressable<HTMLDivElement>(() => navigate(`/events/${event.id}`))}
                      className={cn(
                        "flex gap-4 items-center cursor-pointer p-4 rounded-xl transition-all border shadow-soft group",
                        p.isDark
                          ? "bg-[hsl(220_16%_14%)] border-white/5 hover:border-cyan-500/50"
                          : "bg-white border-gray-100 hover:border-cyan-300 hover:bg-cyan-50/50",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-bold w-11 shrink-0 uppercase tracking-widest text-center",
                          p.muted,
                        )}
                      >
                        {format(event.parsedDate, "d MMM", { locale: dateLocale })}
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] shrink-0" />
                      <div
                        className={cn(
                          "font-bold text-sm line-clamp-1 flex-1 group-hover:text-cyan-500 transition-colors",
                          p.head,
                        )}
                      >
                        {event.title}
                      </div>
                      <span
                        className={cn(
                          "text-xs uppercase tracking-widest font-black px-2 py-1 flex items-center justify-center rounded-lg shrink-0",
                          p.isDark
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {t("Επιβ.", "Conf.")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {dayStoryEvents && (
        <StoryViewer
          events={dayStoryEvents}
          startIndex={0}
          onClose={() => {
            setDayStoryEvents(null);
            setDayStoryDay(null);
          }}
          onOpenDaySchedule={
            dayStoryDay
              ? () => setHourlyViewDay(dayStoryDay)
              : undefined
          }
        />
      )}

      <AnimatePresence>
        {hourlyViewDay && (
          <CalendarHourlySchedule
            day={hourlyViewDay}
            events={upcomingEvents}
            onClose={() => setHourlyViewDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
