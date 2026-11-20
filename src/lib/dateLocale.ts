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

/** "Σάβ 22 Νοε" / "Sat 22 Nov". */
export function formatPlanWhenDay(date: string, language: string): string {
  const parsed = parsePlanDate(date);
  if (!parsed) return date;
  return capFirst(format(parsed, 'EEE d MMM', { locale: dateFnsLocale(language) }));
}

/**
 * One when-line for plans, event cards, and chat:
 * "Σάβ 22 Νοε · 19:30" / "Sat 22 Nov · 19:30".
 */
export function formatPlanWhen(date: string, time: string | undefined, language: string): string {
  const day = formatPlanWhenDay(date, language);
  const tm = (time ?? '').trim();
  return tm ? `${day} · ${tm}` : day;
}
