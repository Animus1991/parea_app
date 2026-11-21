import { format, isValid, parseISO } from 'date-fns';
import { el, enUS } from 'date-fns/locale';

/**
 * Dates follow the UI language. Patterns that differ by language (day/month
 * order, standalone month names) live here so pages do not hard-code English.
 */
export function dateFnsLocale(language: string) {
  return language === 'en' ? enUS : el;
}

/** BCP 47 tag for Intl / toLocale* calls. */
export function intlLocale(language: string): string {
  return language === 'en' ? 'en-US' : 'el-GR';
}

/** "15 Μαΐ" / "May 15". */
export function shortDayMonthPattern(language: string): string {
  return language === 'en' ? 'MMM d' : 'd MMM';
}

function parsePlanDate(date: string): Date | null {
  const iso = parseISO(date);
  if (isValid(iso)) return iso;
  const fallback = new Date(`${date}T12:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function capFirst(value: string): string {
  return value.replace(/^./, (c) => c.toUpperCase());
}

function toDate(date: string | Date): Date | null {
  if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date;
  return parsePlanDate(date);
}

/**
 * The one short date of the app: "Σάβ 22 Νοε" / "Sat 22 Nov". The year shows
 * only when it is not this year ("Σάβ 3 Οκτ 2025"). Accepts a date, an ISO
 * day or a full ISO timestamp.
 */
export function formatPlanWhenDay(date: string | Date, language: string, now: Date = new Date()): string {
  const parsed = toDate(date);
  if (!parsed) return String(date);
  const pattern = parsed.getFullYear() === now.getFullYear() ? 'EEE d MMM' : 'EEE d MMM yyyy';
  return capFirst(format(parsed, pattern, { locale: dateFnsLocale(language) }));
}

/**
 * The long form, only where a single day is the subject (event page, day
 * headers): "Κυριακή 22 Νοεμβρίου" / "Sunday 22 November", year only when
 * it is not this year.
 */
export function formatLongDay(date: string | Date, language: string, now: Date = new Date()): string {
  const parsed = toDate(date);
  if (!parsed) return String(date);
  const pattern = parsed.getFullYear() === now.getFullYear() ? 'EEEE d MMMM' : 'EEEE d MMMM yyyy';
  return capFirst(format(parsed, pattern, { locale: dateFnsLocale(language) }));
}

/**
 * One when-line for plans, event cards, and chat:
 * "Σάβ 22 Νοε · 19:30" / "Sat 22 Nov · 19:30".
 */
export function formatPlanWhen(date: string, time: string | undefined, language: string, now: Date = new Date()): string {
  const day = formatPlanWhenDay(date, language, now);
  const tm = (time ?? '').trim();
  return tm ? `${day} · ${tm}` : day;
}
