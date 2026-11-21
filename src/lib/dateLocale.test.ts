import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { dateFnsLocale, formatLongDay, formatPlanWhen, formatPlanWhenDay, intlLocale, shortDayMonthPattern } from './dateLocale';

const NOW = new Date(2026, 10, 20, 12, 0);

const d = new Date(2026, 4, 15);

describe('dateLocale', () => {
  it('formats long dates in the UI language', () => {
    expect(format(d, 'EEEE, PPP', { locale: dateFnsLocale('el') })).toBe('Παρασκευή, 15 Μαΐου 2026');
    expect(format(d, 'EEEE, PPP', { locale: dateFnsLocale('en') })).toBe('Friday, May 15th, 2026');
  });

  it('uses the nominative month for month headers in Greek', () => {
    expect(format(d, 'LLLL yyyy', { locale: dateFnsLocale('el') })).toBe('Μάιος 2026');
  });

  it('orders day and month per language', () => {
    expect(format(d, shortDayMonthPattern('el'), { locale: dateFnsLocale('el') })).toBe('15 Μαΐ');
    expect(format(d, shortDayMonthPattern('en'), { locale: dateFnsLocale('en') })).toBe('May 15');
    expect(intlLocale('el')).toBe('el-GR');
  });

  it('uses one compact when-line on plans, cards, and chat', () => {
    expect(formatPlanWhenDay('2026-11-22', 'el', NOW)).toBe('Κυρ 22 Νοε');
    expect(formatPlanWhen('2026-11-22', '19:30', 'el', NOW)).toBe('Κυρ 22 Νοε · 19:30');
    expect(formatPlanWhen('2026-11-22', '19:30', 'en', NOW)).toBe('Sun 22 Nov · 19:30');
  });

  it('shows the year only when it is not this year', () => {
    expect(formatPlanWhenDay('2025-10-03', 'el', NOW)).toBe('Παρ 3 Οκτ 2025');
    expect(formatPlanWhenDay('2026-10-03T18:20:00Z', 'el', NOW)).toBe('Σάβ 3 Οκτ');
    expect(formatPlanWhenDay(new Date(2027, 0, 9), 'en', NOW)).toBe('Sat 9 Jan 2027');
  });

  it('writes the long day only where one day is the subject', () => {
    expect(formatLongDay('2026-11-22', 'el', NOW)).toBe('Κυριακή 22 Νοεμβρίου');
    expect(formatLongDay('2026-11-22', 'en', NOW)).toBe('Sunday 22 November');
    expect(formatLongDay('2027-01-09', 'el', NOW)).toBe('Σάββατο 9 Ιανουαρίου 2027');
  });
});
