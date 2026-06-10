import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Compass,
} from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { usePlannedEvents } from '../../hooks/usePlannedEvents';
import { useCalendarDayInteraction } from '../../hooks/useCalendarDayInteraction';
import { plannedEventsForDay, sortPlannedEventsForDay } from '../../lib/plannedEvents';
import { downloadCalendarIcs } from '../../lib/calendarIcs';
import { cn } from '../../lib/utils';
import { CalendarDayCell } from './CalendarDayCell';
import { DayEventsStoriesModal } from './DayEventsStoriesModal';
import { DailyScheduleView } from './DailyScheduleView';
import type { PlannedEvent } from '../../types/plannedEvent';

const WEEKDAY_LABELS = (t: (el: string, en: string) => string) => [
  t('Δευ', 'Mon'),
  t('Τρι', 'Tue'),
  t('Τετ', 'Wed'),
  t('Πεμ', 'Thu'),
  t('Παρ', 'Fri'),
  t('Σαβ', 'Sat'),
  t('Κυρ', 'Sun'),
];

export interface PlannedEventsCalendarProps {
  className?: string;
}

export function PlannedEventsCalendar({ className }: PlannedEventsCalendarProps) {
  const { t } = useLanguage();
  const p = usePageContrast();
  const navigate = useNavigate();
  const { plannedEvents } = usePlannedEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [storiesDay, setStoriesDay] = useState<Date | null>(null);
  const [storiesEvents, setStoriesEvents] = useState<PlannedEvent[] | null>(null);
  const [scheduleDay, setScheduleDay] = useState<Date | null>(null);

  const openStories = useCallback((day: Date, events: PlannedEvent[]) => {
    if (events.length === 0) return;
    setStoriesDay(day);
    setStoriesEvents(sortPlannedEventsForDay(events));
  }, []);

  const { handleCellClick } = useCalendarDayInteraction(
    (day, dayEvents) => openStories(day, dayEvents as PlannedEvent[]),
    (day, dayEvents) => {
      const list = dayEvents as PlannedEvent[];
      if (list.length > 0) setScheduleDay(day);
    },
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const weekdays = WEEKDAY_LABELS(t);

  const handleExport = () => {
    downloadCalendarIcs(
      plannedEvents.map((e) => ({
        title: e.title,
        date: e.event.date,
        time: e.time,
        locationArea: e.locationName,
      })),
      'parea-planned-events.ics',
    );
  };

  const renderCell = (day: Date, inPeriod: boolean) => {
    const dayList = plannedEventsForDay(plannedEvents, day);
    return (
      <CalendarDayCell
        key={day.toISOString()}
        day={day}
        events={dayList}
        isCurrentPeriod={inPeriod}
        isDark={p.isDark}
        isAB={p.isAB}
        headClass={p.head}
        onClick={() => handleCellClick(day, dayList)}
        onOpenSchedule={dayList.length > 0 ? () => setScheduleDay(day) : undefined}
      />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {plannedEvents.length === 0 ? (
        <div className={cn('text-center py-16 px-6 rounded-2xl border border-dashed', p.cardSurface, p.borderB)}>
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', p.statBg)}>
            <Compass className={cn('w-7 h-7', p.statVal)} />
          </div>
          <p className={cn('font-bold text-lg', p.head)}>
            {t('Δεν έχετε προγραμματισμένες εκδηλώσεις', 'No planned events yet')}
          </p>
          <p className={cn('text-sm font-medium mt-2 max-w-sm mx-auto', p.muted)}>
            {t(
              'Όταν μπείτε σε μια ομάδα, οι εκδηλώσεις σας θα εμφανίζονται εδώ.',
              'When you join a group, your events will appear here.',
            )}
          </p>
          <button type="button" className="btn-gradient mt-6" onClick={() => navigate('/')}>
            {t('Εξερεύνησε εκδηλώσεις', 'Explore experiences')}
          </button>
        </div>
      ) : (
        <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {plannedEvents.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border min-h-11',
              p.cardSurface,
              p.borderB,
              p.cardHover,
              p.head,
            )}
          >
            <Download className={cn('w-4 h-4', p.iconAccent)} />
            {t('Εξαγωγή', 'Export')}
          </button>
        )}
        <div
          className={cn(
            'flex p-1 rounded-2xl border relative shadow-soft',
            p.isDark
              ? 'bg-[hsl(220_16%_12%)] border-[hsl(220_13%_22%)]'
              : 'bg-gray-100 border-gray-200',
          )}
        >
          <div
            className={cn(
              'absolute inset-y-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300',
              view === 'week' ? 'left-1' : 'left-[calc(50%+2px)]',
              p.isDark && p.isAB ? 'bg-[hsl(220_16%_22%)]' : 'bg-white dark:bg-gray-800',
            )}
          />
          <button
            type="button"
            className={cn(
              'relative z-10 px-5 py-2 text-xs font-bold min-h-11',
              view === 'week' ? p.head : p.muted,
            )}
            onClick={() => setView('week')}
          >
            {t('Εβδομάδα', 'Week')}
          </button>
          <button
            type="button"
            className={cn(
              'relative z-10 px-6 py-2 text-xs font-bold min-h-11',
              view === 'month' ? p.head : p.muted,
            )}
            onClick={() => setView('month')}
          >
            {t('Μήνας', 'Month')}
          </button>
        </div>
      </div>

      <div className={cn('rounded-2xl border overflow-hidden shadow-soft', p.cardSurface, p.borderB)}>
        <div
          className={cn(
            'flex items-center justify-between px-4 md:px-8 py-4 border-b gap-2',
            p.borderB,
          )}
        >
          <h2 className={cn('font-extrabold text-lg md:text-2xl capitalize', p.head)}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))
              }
              className={cn('p-2 rounded-2xl min-h-11 min-w-11', p.isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')}
              aria-label={t('Προηγούμενη', 'Previous')}
            >
              <ChevronLeft className={cn('w-5 h-5', p.head)} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className={cn(
                'px-3 py-2 text-xs font-bold rounded-2xl border min-h-11',
                p.isDark ? 'border-white/10' : 'border-gray-200',
                p.head,
              )}
            >
              {t('Σήμερα', 'Today')}
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))
              }
              className={cn('p-2 rounded-2xl min-h-11 min-w-11', p.isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')}
              aria-label={t('Επόμενη', 'Next')}
            >
              <ChevronRight className={cn('w-5 h-5', p.head)} />
            </button>
          </div>
        </div>

        <p className={cn('text-[11px] font-medium px-4 md:px-8 py-2 border-b', p.borderB, p.muted)}>
          {t(
            'Πάτημα: προεπισκόπηση · Διπλό πάτημα: ωριαίο πρόγραμμα',
            'Tap: preview · Double-tap: hourly schedule',
          )}
        </p>

        <AnimatePresence mode="wait">
          {view === 'week' ? (
            <motion.div
              key="week"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 md:p-6 overflow-x-hidden"
            >
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {weekdays.map((label) => (
                  <div
                    key={label}
                    className={cn(
                      'text-center text-[10px] md:text-xs font-bold uppercase tracking-widest py-1',
                      p.muted,
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-2 max-w-full">
                {weekDays.map((day) => renderCell(day, true))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="month"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 md:p-6 overflow-x-hidden"
            >
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {weekdays.map((label) => (
                  <div
                    key={label}
                    className={cn(
                      'text-center text-[10px] font-bold uppercase tracking-widest py-1 rounded-lg',
                      p.isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500',
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-2 max-w-full">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`b-${i}`} className="aspect-square rounded-2xl opacity-0 pointer-events-none" />
                ))}
                {monthDays.map((day) => renderCell(day, isSameMonth(day, currentDate)))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {storiesEvents && storiesDay && (
        <DayEventsStoriesModal
          day={storiesDay}
          events={storiesEvents}
          onClose={() => {
            setStoriesEvents(null);
            setStoriesDay(null);
          }}
          onOpenDaySchedule={() => {
            setScheduleDay(storiesDay);
          }}
        />
      )}

      <AnimatePresence>
        {scheduleDay && (
          <DailyScheduleView
            day={scheduleDay}
            events={plannedEvents}
            onClose={() => setScheduleDay(null)}
          />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
