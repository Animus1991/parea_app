import { differenceInCalendarDays, format } from 'date-fns';

export function formatCountdown(targetMs: number, nowMs: number, lang: 'el' | 'en'): string {
  const remainingMs = targetMs - nowMs;
  if (remainingMs <= 60_000) return lang === 'el' ? 'τώρα' : 'now';

  const minutes = Math.ceil(remainingMs / 60_000);
  if (minutes < 60) return lang === 'el' ? `σε ${minutes}′` : `in ${minutes} min`;

  const target = new Date(targetMs);
  const now = new Date(nowMs);
  const calendarDays = differenceInCalendarDays(target, now);
  if (calendarDays === 1) {
    const time = format(target, 'HH:mm');
    return lang === 'el' ? `αύριο ${time}` : `tomorrow ${time}`;
  }
  if (remainingMs < 24 * 60 * 60_000) {
    const hours = Math.ceil(remainingMs / (60 * 60_000));
    return lang === 'el' ? `σε ${hours} ώρες` : `in ${hours} hours`;
  }
  const days = Math.ceil(remainingMs / (24 * 60 * 60_000));
  return lang === 'el' ? `σε ${days} μέρες` : `in ${days} days`;
}
