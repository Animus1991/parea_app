import { useRef, useCallback } from 'react';

/**
 * Single-click vs double-click on calendar day cells (ZIP smart calendar pattern).
 */
export function useCalendarDayInteraction(
  onSingleClick: (day: Date, dayEvents: unknown[]) => void,
  onDoubleClick: (day: Date, dayEvents: unknown[]) => void,
  delayMs = 250,
) {
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCellClick = useCallback(
    (day: Date, dayEvents: unknown[]) => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
        onDoubleClick(day, dayEvents);
      } else {
        clickTimeout.current = setTimeout(() => {
          clickTimeout.current = null;
          onSingleClick(day, dayEvents);
        }, delayMs);
      }
    },
    [onSingleClick, onDoubleClick, delayMs],
  );

  return { handleCellClick };
}
