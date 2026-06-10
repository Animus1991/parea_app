import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import type { PlannedEvent } from '../../types/plannedEvent';

export interface CalendarDayCellProps {
  day: Date;
  events: PlannedEvent[];
  isCurrentPeriod: boolean;
  isDark: boolean;
  isAB: boolean;
  headClass: string;
  onClick: () => void;
  onOpenSchedule?: () => void;
}

function EventThumb({
  ev,
  className,
  showTime = true,
  showLocation = false,
}: {
  ev: PlannedEvent;
  className?: string;
  showTime?: boolean;
  showLocation?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const bgUrl = imgFailed
    ? undefined
    : ev.imageUrl;

  return (
    <div
      className={cn(
        'relative overflow-hidden w-full h-full',
        imgFailed && 'bg-gradient-to-br from-cyan-800 to-slate-900',
        className,
      )}
      style={
        bgUrl
          ? {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-gradient-to-t from-black/85 to-transparent">
        <p className="text-[7px] md:text-[8px] text-white truncate font-bold leading-tight">{ev.title}</p>
        {showTime && (
          <p className="text-[6px] md:text-[7px] text-white/85 truncate leading-tight">{ev.time}</p>
        )}
        {showLocation && (
          <p className="text-[6px] text-white/75 truncate hidden lg:block">{ev.locationName}</p>
        )}
      </div>
    </div>
  );
}

function DesktopEventLayout({ events }: { events: PlannedEvent[] }) {
  const n = events.length;
  const display = n > 6 ? events.slice(0, 6) : events;
  const overflow = n > 6 ? n - 6 : 0;

  if (n === 1) {
    return <EventThumb ev={display[0]} showTime showLocation className="rounded-none" />;
  }

  if (n === 2) {
    return (
      <div className="w-full h-full flex flex-col">
        <EventThumb ev={display[0]} showTime className="flex-1 border-b border-white/25" />
        <EventThumb ev={display[1]} showTime className="flex-1" />
      </div>
    );
  }

  if (n === 3) {
    return (
      <div className="w-full h-full grid grid-rows-3 grid-cols-1">
        {display.map((ev) => (
          <EventThumb key={ev.id} ev={ev} showTime className="border-b border-white/20 last:border-b-0" />
        ))}
      </div>
    );
  }

  if (n === 4) {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
        {display.map((ev) => (
          <EventThumb key={ev.id} ev={ev} className="border-r border-b border-white/20" />
        ))}
      </div>
    );
  }

  if (n === 5) {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-3">
        {display.map((ev, i) => (
          <EventThumb
            key={ev.id}
            ev={ev}
            className={cn('border-r border-b border-white/20', i === 4 && 'col-span-2')}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-3">
      {display.map((ev) => (
        <EventThumb key={ev.id} ev={ev} className="border-r border-b border-white/20" />
      ))}
      {overflow > 0 && (
        <div className="flex items-center justify-center bg-cyan-900/90 border-r border-b border-white/20">
          <span className="text-white font-bold text-[9px] md:text-[10px]">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

export function CalendarDayCell({
  day,
  events,
  isCurrentPeriod,
  isDark,
  isAB,
  headClass,
  onClick,
  onOpenSchedule,
}: CalendarDayCellProps) {
  const { t } = useLanguage();
  const today = isToday(day);
  const hasEvents = events.length > 0;
  const categoryDots = [...new Set(events.map((e) => e.category))].slice(0, 3);

  return (
    <div
      className={cn(
        'relative min-h-[88px] sm:min-h-[100px] md:min-h-0 md:aspect-[3/4] lg:aspect-square',
        'flex flex-col items-center justify-center rounded-2xl transition-all border overflow-hidden w-full',
        today
          ? isAB
            ? 'bg-[hsl(220_16%_22%)] text-white border-[hsl(220_13%_30%)] shadow-sm'
            : 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
          : hasEvents
            ? isDark
              ? 'bg-cyan-900/20 border-cyan-800/50 hover:bg-cyan-900/40'
              : 'bg-cyan-50 border-cyan-100 hover:bg-cyan-100'
            : isDark
              ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)] hover:bg-white/5'
              : 'bg-white border-gray-100 hover:bg-gray-50',
        !isCurrentPeriod && 'opacity-30 pointer-events-none',
      )}
    >
      {hasEvents && onOpenSchedule && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSchedule();
          }}
          className={cn(
            'absolute top-1 right-1 z-20 p-1 rounded-lg min-h-8 min-w-8 flex items-center justify-center',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
            today || hasEvents
              ? 'bg-black/40 hover:bg-black/55 text-white'
              : isDark
                ? 'bg-white/10 hover:bg-white/20 text-gray-200'
                : 'bg-white/90 hover:bg-white text-gray-700 shadow-sm',
          )}
          aria-label={t('Ημερήσιο πρόγραμμα', 'Daily schedule')}
        >
          <CalendarClock className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={!isCurrentPeriod}
        className={cn(
          'absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-2xl',
        )}
      >
      {hasEvents && (
        <div className="hidden md:block absolute inset-0 z-0 pointer-events-none">
          <DesktopEventLayout events={events} />
        </div>
      )}

      <span
        className={cn(
          'relative z-10 text-sm md:text-lg font-black leading-none',
          (today || hasEvents) && 'text-white drop-shadow-md',
          !today && !hasEvents && headClass,
        )}
      >
        {format(day, 'd')}
      </span>

      {hasEvents && (
        <div className="md:hidden relative z-10 mt-1 flex flex-col items-center gap-1">
          <span className="flex items-center justify-center bg-amber-500 text-white rounded-full min-w-[20px] h-5 px-1.5 text-[10px] font-bold shadow-soft">
            {events.length}
          </span>
          <div className="flex gap-0.5">
            {categoryDots.map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-cyan-600/80"
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}
      </button>
    </div>
  );
}
