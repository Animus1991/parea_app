import { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import type { PlannedEvent } from '../../types/plannedEvent';
import { plannedEventsForDay } from '../../lib/plannedEvents';

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24;
const HOUR_PX = 56;

function minutesFromDayStart(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() - DAY_START_HOUR * 60;
}

function layoutDayEvents(dayEvents: PlannedEvent[]) {
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const sorted = [...dayEvents].sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  type LaidOut = PlannedEvent & { top: number; height: number; column: number; columns: number };

  const laid: LaidOut[] = [];
  const columns: { end: number }[] = [];

  for (const ev of sorted) {
    const startMin = Math.max(0, minutesFromDayStart(ev.startDateTime));
    const endMin = Math.min(
      totalMinutes,
      Math.max(startMin + 30, minutesFromDayStart(ev.endDateTime)),
    );
    let col = 0;
    while (columns[col] && columns[col].end > startMin) col++;
    if (!columns[col]) columns[col] = { end: 0 };
    columns[col].end = endMin;
    laid.push({
      ...ev,
      top: (startMin / totalMinutes) * 100,
      height: Math.max(4, ((endMin - startMin) / totalMinutes) * 100),
      column: col,
      columns: 1,
    });
  }

  const maxCol = columns.length || 1;
  return laid.map((e) => ({ ...e, columns: maxCol }));
}

export interface DailyScheduleViewProps {
  day: Date;
  events: PlannedEvent[];
  onClose: () => void;
}

export function DailyScheduleView({ day, events, onClose }: DailyScheduleViewProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const p = usePageContrast();

  const dayEvents = useMemo(
    () => plannedEventsForDay(events, day),
    [events, day],
  );

  const blocks = useMemo(() => layoutDayEvents(dayEvents), [dayEvents]);
  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-2xl shadow-soft flex flex-col max-h-[90vh] overflow-hidden border',
          p.isDark ? 'bg-[hsl(220_16%_16%)] border-white/10' : 'bg-white border-gray-200',
        )}
      >
        <div className={cn('p-5 flex items-center justify-between border-b shrink-0', p.borderB)}>
          <div>
            <h3 className={cn('font-bold text-lg', p.head)}>{format(day, 'd MMMM yyyy')}</h3>
            <p className={cn('text-xs font-bold uppercase tracking-widest', p.muted)}>
              {t('Ημερήσιο πρόγραμμα', 'Daily schedule')}
            </p>
          </div>
          <button
            type="button"
            className={cn(
              'p-2 rounded-2xl transition-colors min-h-11 min-w-11 flex items-center justify-center',
              p.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200',
            )}
            onClick={onClose}
            aria-label={t('Κλείσιμο', 'Close')}
          >
            <X className={cn('w-5 h-5', p.head)} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {dayEvents.length === 0 ? (
            <p className={cn('text-center py-12 text-sm font-medium', p.muted)}>
              {t('Δεν υπάρχουν προγραμματισμένες εκδηλώσεις', 'No planned events this day')}
            </p>
          ) : (
            <div className="flex gap-3">
              <div className="w-12 shrink-0 relative" style={{ height: timelineHeight }}>
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }).map((_, i) => {
                  const hour = DAY_START_HOUR + i;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        'absolute right-0 text-xs font-bold -translate-y-1/2',
                        p.muted,
                      )}
                      style={{ top: i * HOUR_PX }}
                    >
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </div>
                  );
                })}
              </div>

              <div
                className={cn(
                  'flex-1 relative border-l',
                  p.borderB,
                  p.isDark ? 'bg-black/10' : 'bg-gray-50/80',
                )}
                style={{ height: timelineHeight, minHeight: timelineHeight }}
              >
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }).map((_, i) => (
                  <div
                    key={i}
                    className={cn('absolute left-0 right-0 border-t', p.borderB)}
                    style={{ top: i * HOUR_PX }}
                  />
                ))}

                {blocks.map((block) => {
                  const widthPct = 100 / block.columns;
                  const leftPct = widthPct * block.column;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => navigate(`/events/${block.id}`)}
                      className={cn(
                        'absolute rounded-xl border text-left overflow-hidden shadow-soft transition-transform hover:scale-[1.01] min-h-[44px] px-2 py-1.5',
                        p.isDark
                          ? 'bg-cyan-900/40 border-cyan-700/50 hover:border-cyan-500'
                          : 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
                      )}
                      style={{
                        top: `${block.top}%`,
                        height: `${block.height}%`,
                        left: `${leftPct}%`,
                        width: `calc(${widthPct}% - 4px)`,
                        marginLeft: 2,
                      }}
                    >
                      <span className="text-xs font-bold text-cyan-600 block">{block.time}</span>
                      <p className={cn('text-sm font-bold line-clamp-2 leading-tight', p.head)}>
                        {block.title}
                      </p>
                      <p className={cn('text-xs flex items-center gap-0.5 mt-0.5 truncate', p.muted)}>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {block.locationName}
                      </p>
                      <span className={cn('text-xs font-medium', p.muted)}>
                        {format(block.endDateTime, 'HH:mm')} ·{' '}
                        {Math.round(
                          (block.endDateTime.getTime() - block.startDateTime.getTime()) / 60_000,
                        )}
                        m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** @deprecated alias */
export const CalendarHourlySchedule = DailyScheduleView;
