import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { dateFnsLocale, formatPlanWhen, formatPlanWhenDay, intlLocale, shortDayMonthPattern } from './dateLocale';

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
    expect(formatPlanWhenDay('2026-11-22', 'el')).toBe('Κυρ 22 Νοε');
    expect(formatPlanWhen('2026-11-22', '19:30', 'el')).toBe('Κυρ 22 Νοε · 19:30');
    expect(formatPlanWhen('2026-11-22', '19:30', 'en')).toBe('Sun 22 Nov · 19:30');
  });
});
