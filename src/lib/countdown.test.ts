import { describe, expect, it } from 'vitest';
import { formatCountdown } from './countdown';

describe('formatCountdown', () => {
  it('formats minutes, hours, days, tomorrow and now in both languages', () => {
    const now = new Date(2030, 0, 1, 10, 0).getTime();
    expect(formatCountdown(now + 40 * 60_000, now, 'el')).toBe('σε 40′');
    expect(formatCountdown(now + 40 * 60_000, now, 'en')).toBe('in 40 min');
    expect(formatCountdown(now + 5 * 60 * 60_000, now, 'el')).toBe('σε 5 ώρες');
    expect(formatCountdown(now + 5 * 60 * 60_000, now, 'en')).toBe('in 5 hours');
    expect(formatCountdown(now + 3 * 24 * 60 * 60_000, now, 'el')).toBe('σε 3 μέρες');
    expect(formatCountdown(now + 3 * 24 * 60 * 60_000, now, 'en')).toBe('in 3 days');
    expect(formatCountdown(new Date(2030, 0, 2, 20, 30).getTime(), new Date(2030, 0, 1, 20, 30).getTime(), 'en')).toBe('tomorrow 20:30');
    expect(formatCountdown(new Date(2030, 0, 2, 20, 30).getTime(), new Date(2030, 0, 1, 20, 30).getTime(), 'el')).toBe('αύριο 20:30');
    expect(formatCountdown(now + 30_000, now, 'en')).toBe('now');
  });
});
