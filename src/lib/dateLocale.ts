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
