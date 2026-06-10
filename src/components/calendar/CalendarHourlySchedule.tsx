import { format, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import type { CalendarEventWithDate } from '../../hooks/useUserCalendarEvents';

export interface CalendarHourlyScheduleProps {
  day: Date;
  events: CalendarEventWithDate[];
  onClose: () => void;
}

/**
 * @deprecated Legacy hourly modal kept for backwards compatibility (Φ21).
 * The calendar uses `DailyScheduleView` (see `DailyScheduleView.tsx`) — prefer
 * that component for any new usage.
 */

export function CalendarHourlySchedule({ day, events, onClose }: CalendarHourlyScheduleProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const p = usePageContrast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl shadow-soft flex flex-col h-[80vh] overflow-hidden border',
          p.isDark ? 'bg-[hsl(220_16%_16%)] border-white/10' : 'bg-white border-gray-200',
        )}
      >
        <div className={cn('p-5 flex items-center justify-between border-b', p.borderB)}>
          <div>
            <h3 className={cn('font-bold text-lg', p.head)}>{format(day, 'd MMMM yyyy')}</h3>
            <p className={cn('text-xs font-bold uppercase tracking-widest', p.muted)}>
              {t('Ημερήσιο Πρόγραμμα', 'Daily Schedule')}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Array.from({ length: 24 }).map((_, hour) => {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const hourEvents = events.filter(
              (ev) =>
                isSameDay(ev.parsedDate, day) &&
                ev.time.startsWith(`${hour.toString().padStart(2, '0')}:`),
            );

            return (
              <div key={hour} className="flex gap-4">
                <div
                  className={cn(
                    'w-14 shrink-0 text-right text-xs font-bold uppercase tracking-wider py-2',
                    p.muted,
                  )}
                >
                  {timeString}
                </div>
                <div className={cn('flex-1 border-t relative pt-2 pb-6 flex flex-col gap-2', p.borderB)}>
                  {hourEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className={cn(
                        'p-3 rounded-2xl border flex flex-col text-left active:scale-95 transition-transform w-full',
                        p.isDark
                          ? 'bg-cyan-900/20 border-cyan-800/40 hover:border-cyan-600/50'
                          : 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
                      )}
                    >
                      <span className="text-xs font-bold text-cyan-500 mb-1">{ev.time}</span>
                      <p className={cn('text-sm font-bold', p.head)}>{ev.title}</p>
                      <p className={cn('text-xs flex items-center gap-1 mt-1', p.muted)}>
                        <MapPin className="w-3 h-3" />
                        {ev.locationArea}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
