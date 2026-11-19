import { describe, expect, it } from 'vitest';
import {
  emptyHomeSchedule,
  eventMatchesSchedule,
  hourInRange,
  isScheduleFilterActive,
  parseHomeScheduleFromSearch,
  scheduleFromCoarseAvailability,
  serializeHomeSchedule,
  schedulesEqual,
} from './homeScheduleFilter';

describe('homeScheduleFilter', () => {
  it('treats an empty schedule as no constraint', () => {
    expect(isScheduleFilterActive(emptyHomeSchedule())).toBe(false);
    expect(eventMatchesSchedule({ date: '2026-11-20', time: '10:00' }, emptyHomeSchedule())).toBe(
      true,
    );
  });

  it('keeps only nights on selected weekdays', () => {
    const schedule = { ...emptyHomeSchedule(), weekdays: [4] }; // Thursday
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '21:00' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-20', time: '21:00' }, schedule)).toBe(false);
  });

  it('keeps only nights in the evening/night window', () => {
    const schedule = { ...emptyHomeSchedule(), windowIds: ['night' as const] };
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '20:00' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '21:30' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '18:00' }, schedule)).toBe(false);
  });

  it('ORs specific dates with repeating weekdays', () => {
    const schedule = {
      ...emptyHomeSchedule(),
      dates: ['2026-11-20'],
      weekdays: [4],
    };
    expect(eventMatchesSchedule({ date: '2026-11-20', time: '20:00' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '20:00' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-21', time: '20:00' }, schedule)).toBe(false);
  });

  it('wraps overnight hour ranges', () => {
    expect(hourInRange(22, 21, 2)).toBe(true);
    expect(hourInRange(1, 21, 2)).toBe(true);
    expect(hourInRange(10, 21, 2)).toBe(false);
  });

  it('treats custom hours as inclusive, including the until hour', () => {
    const schedule = { ...emptyHomeSchedule(), hourFrom: 18, hourTo: 21 };
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '21:00' }, schedule)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '17:00' }, schedule)).toBe(false);
    const overnight = { ...emptyHomeSchedule(), hourFrom: 21, hourTo: 2 };
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '01:00' }, overnight)).toBe(true);
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '10:00' }, overnight)).toBe(false);
    const customOverridesWindows = {
      ...emptyHomeSchedule(),
      windowIds: ['morning' as const],
      hourFrom: 21,
      hourTo: 23,
    };
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '21:00' }, customOverridesWindows)).toBe(
      true,
    );
    expect(eventMatchesSchedule({ date: '2026-11-19', time: '10:00' }, customOverridesWindows)).toBe(
      false,
    );
  });

  it('maps coarse availability without dropping those settings', () => {
    const fromSettings = scheduleFromCoarseAvailability(['weekends', 'weekday_evenings']);
    expect(fromSettings.weekdays.sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(fromSettings.windowIds).toEqual(['evening', 'night']);
  });

  it('round-trips through search params', () => {
    const schedule = {
      ...emptyHomeSchedule(),
      dates: ['2026-11-22'],
      weekdays: [5, 6],
      windowIds: ['evening' as const],
      hourFrom: 19,
      hourTo: 23,
    };
    const serialized = serializeHomeSchedule(schedule);
    const params = new URLSearchParams();
    if (serialized.on) params.set('on', serialized.on);
    if (serialized.wd) params.set('wd', serialized.wd);
    if (serialized.tw) params.set('tw', serialized.tw);
    if (serialized.hrs) params.set('hrs', serialized.hrs);
    expect(parseHomeScheduleFromSearch(params)).toEqual(schedule);
    expect(schedulesEqual(schedule, parseHomeScheduleFromSearch(params))).toBe(true);
    expect(schedulesEqual(schedule, emptyHomeSchedule())).toBe(false);
  });
});
