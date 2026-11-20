/**
 * Discover schedule filter — dates, weekdays, hours the user actually has free.
 * Empty means "any time" (existing catalog). When set, it hides nights that
 * cannot fit, so the feed is a plan, not a poster wall.
 */

export interface HomeScheduleFilter {
  /** Specific yyyy-MM-dd dates. */
  dates: string[];
  /** JS getDay() values (0=Sun … 6=Sat). */
  weekdays: number[];
  /** Named windows; OR'd together. */
  windowIds: HomeTimeWindowId[];
  /** Optional precise range (24h clock). Overnight allowed (21 → 2). */
  hourFrom: number | null;
  hourTo: number | null;
}

export type HomeTimeWindowId = 'morning' | 'afternoon' | 'evening' | 'night';

export const HOME_TIME_WINDOWS: {
  id: HomeTimeWindowId;
  from: number;
  to: number;
  el: string;
  en: string;
}[] = [
  { id: 'morning', from: 6, to: 12, el: 'Πρωί', en: 'Morning' },
  { id: 'afternoon', from: 12, to: 17, el: 'Μεσημέρι', en: 'Afternoon' },
  { id: 'evening', from: 17, to: 20, el: 'Απόγευμα', en: 'Evening' },
  { id: 'night', from: 20, to: 2, el: 'Βράδυ', en: 'Night' },
];

/** Monday-first, matching Greek calendars. */
export const HOME_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const HOME_WEEKDAY_LABELS: Record<number, { el: string; en: string }> = {
  1: { el: 'Δε', en: 'Mon' },
  2: { el: 'Τρ', en: 'Tue' },
  3: { el: 'Τε', en: 'Wed' },
  4: { el: 'Πε', en: 'Thu' },
  5: { el: 'Πα', en: 'Fri' },
  6: { el: 'Σα', en: 'Sat' },
  0: { el: 'Κυ', en: 'Sun' },
};

export const EMPTY_HOME_SCHEDULE: HomeScheduleFilter = {
  dates: [],
  weekdays: [],
  windowIds: [],
  hourFrom: null,
  hourTo: null,
};

export function emptyHomeSchedule(): HomeScheduleFilter {
  return {
    dates: [],
    weekdays: [],
    windowIds: [],
    hourFrom: null,
    hourTo: null,
  };
}

export function isScheduleFilterActive(schedule: HomeScheduleFilter | null | undefined): boolean {
  if (!schedule) return false;
  return (
    schedule.dates.length > 0 ||
    schedule.weekdays.length > 0 ||
    schedule.windowIds.length > 0 ||
    schedule.hourFrom != null ||
    schedule.hourTo != null
  );
}

export function parseEventHour(time?: string): number | null {
  if (!time) return null;
  const hour = Number.parseInt(time.split(':')[0] ?? '', 10);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

/** Inclusive start, exclusive end; overnight ranges (21→2) wrap midnight. */
export function hourInRange(hour: number, from: number, to: number): boolean {
  if (from === to) return true;
  if (from < to) return hour >= from && hour < to;
  return hour >= from || hour < to;
}

export function eventMatchesSchedule(
  event: { date: string; time?: string },
  schedule: HomeScheduleFilter,
): boolean {
  if (!isScheduleFilterActive(schedule)) return true;

  const eventDay = new Date(`${event.date}T12:00:00`);
  if (Number.isNaN(eventDay.getTime())) return false;

  const hasDates = schedule.dates.length > 0;
  const hasWeekdays = schedule.weekdays.length > 0;
  const dow = eventDay.getDay();
  const inDates = hasDates && schedule.dates.includes(event.date);
  const inWeekdays = hasWeekdays && schedule.weekdays.includes(dow);

  if (hasDates && hasWeekdays) {
    if (!inDates && !inWeekdays) return false;
  } else if (hasDates && !inDates) {
    return false;
  } else if (hasWeekdays && !inWeekdays) {
    return false;
  }

  const hour = parseEventHour(event.time);
  const windows = schedule.windowIds
    .map((id) => HOME_TIME_WINDOWS.find((w) => w.id === id))
    .filter((w): w is (typeof HOME_TIME_WINDOWS)[number] => Boolean(w));
  const hasCustom = schedule.hourFrom != null || schedule.hourTo != null;
  if (windows.length === 0 && !hasCustom) return true;
  if (hour == null) return false;

  if (hasCustom) return hourMatchesCustom(hour, schedule.hourFrom, schedule.hourTo);
  return windows.some((w) => hourInRange(hour, w.from, w.to));
}

/** Custom from/to selects are inclusive, including overnight (21 → 2). */
export function hourMatchesCustom(
  hour: number,
  from: number | null,
  to: number | null,
): boolean {
  const start = from ?? 0;
  const end = to ?? 23;
  if (start === end) return hour === start;
  if (start < end) return hour >= start && hour <= end;
  return hour >= start || hour <= end;
}

export function toggleListValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Coarse settings/onboarding slots → a concrete schedule, without deleting those slots.
 */
export function scheduleFromCoarseAvailability(slots: string[]): HomeScheduleFilter {
  const next = emptyHomeSchedule();
  const set = new Set(slots);
  const weekdays = new Set<number>();
  const windows = new Set<HomeTimeWindowId>();

  if (set.has('weekends')) {
    weekdays.add(0);
    weekdays.add(6);
  }
  if (set.has('weekday_evenings') || set.has('weekday_eve')) {
    [1, 2, 3, 4, 5].forEach((d) => weekdays.add(d));
    windows.add('evening');
    windows.add('night');
  }
  if (set.has('weekday_mornings') || set.has('mornings')) {
    [1, 2, 3, 4, 5].forEach((d) => weekdays.add(d));
    windows.add('morning');
  }
  if (set.has('flexible')) {
    return emptyHomeSchedule();
  }

  next.weekdays = [...weekdays].sort((a, b) => a - b);
  next.windowIds = HOME_TIME_WINDOWS.map((w) => w.id).filter((id) => windows.has(id));
  return next;
}

export function schedulesEqual(a: HomeScheduleFilter, b: HomeScheduleFilter): boolean {
  const left = serializeHomeSchedule(a);
  const right = serializeHomeSchedule(b);
  return left.on === right.on && left.wd === right.wd && left.tw === right.tw && left.hrs === right.hrs;
}

export function serializeHomeSchedule(schedule: HomeScheduleFilter): {
  on?: string;
  wd?: string;
  hrs?: string;
  tw?: string;
} {
  const out: { on?: string; wd?: string; hrs?: string; tw?: string } = {};
  if (schedule.dates.length) out.on = [...schedule.dates].sort().join(',');
  if (schedule.weekdays.length) out.wd = [...schedule.weekdays].sort((a, b) => a - b).join(',');
  if (schedule.windowIds.length) {
    out.tw = HOME_TIME_WINDOWS.map((w) => w.id)
      .filter((id) => schedule.windowIds.includes(id))
      .join(',');
  }
  if (schedule.hourFrom != null || schedule.hourTo != null) {
    out.hrs = `${schedule.hourFrom ?? 0}-${schedule.hourTo ?? 24}`;
  }
  return out;
}

export function parseHomeScheduleFromSearch(params: {
  get: (key: string) => string | null;
}): HomeScheduleFilter {
  const next = emptyHomeSchedule();
  const on = params.get('on');
  const wd = params.get('wd');
  const tw = params.get('tw');
  const hrs = params.get('hrs');

  if (on) {
    next.dates = on.split(',').filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  }
  if (wd) {
    next.weekdays = wd
      .split(',')
      .map((n) => Number.parseInt(n, 10))
      .filter((n) => n >= 0 && n <= 6);
  }
  if (tw) {
    next.windowIds = tw.split(',').filter((id): id is HomeTimeWindowId =>
      HOME_TIME_WINDOWS.some((w) => w.id === id),
    );
  }
  if (hrs) {
    const [fromRaw, toRaw] = hrs.split('-');
    const from = Number.parseInt(fromRaw ?? '', 10);
    const to = Number.parseInt(toRaw ?? '', 10);
    next.hourFrom = Number.isFinite(from) ? from : null;
    next.hourTo = Number.isFinite(to) ? to : null;
  }
  return next;
}

export function upcomingDateKeys(days = 14, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export function summarizeHomeSchedule(schedule: HomeScheduleFilter): { el: string; en: string } {
  if (!isScheduleFilterActive(schedule)) {
    return { el: 'Πρόγραμμα', en: 'Schedule' };
  }
  const dayEl = schedule.weekdays
    .slice()
    .sort((a, b) => HOME_WEEKDAY_ORDER.indexOf(a as (typeof HOME_WEEKDAY_ORDER)[number]) - HOME_WEEKDAY_ORDER.indexOf(b as (typeof HOME_WEEKDAY_ORDER)[number]))
    .map((d) => HOME_WEEKDAY_LABELS[d]?.el)
    .filter(Boolean)
    .join('·');
  const dayEn = schedule.weekdays
    .slice()
    .sort((a, b) => HOME_WEEKDAY_ORDER.indexOf(a as (typeof HOME_WEEKDAY_ORDER)[number]) - HOME_WEEKDAY_ORDER.indexOf(b as (typeof HOME_WEEKDAY_ORDER)[number]))
    .map((d) => HOME_WEEKDAY_LABELS[d]?.en)
    .filter(Boolean)
    .join('·');
  const windowsEl = schedule.windowIds
    .map((id) => HOME_TIME_WINDOWS.find((w) => w.id === id)?.el)
    .filter(Boolean)
    .join('·');
  const windowsEn = schedule.windowIds
    .map((id) => HOME_TIME_WINDOWS.find((w) => w.id === id)?.en)
    .filter(Boolean)
    .join('·');
  const hours =
    schedule.hourFrom != null || schedule.hourTo != null
      ? `${String(schedule.hourFrom ?? 0).padStart(2, '0')}–${String(schedule.hourTo ?? 24).padStart(2, '0')}`
      : '';
  const dateCount = schedule.dates.length;
  const partsEl = [
    dayEl,
    windowsEl,
    hours,
    dateCount ? `${dateCount} ημερ.` : '',
  ].filter(Boolean);
  const partsEn = [
    dayEn,
    windowsEn,
    hours,
    dateCount ? `${dateCount} dates` : '',
  ].filter(Boolean);
  return {
    el: partsEl.join(' · ') || 'Πρόγραμμα',
    en: partsEn.join(' · ') || 'Schedule',
  };
}

export function homeScheduleStorageKey(userId?: string | null): string {
  return `nakamas-home-schedule:${userId || 'anon'}`;
}

export function readStoredHomeSchedule(userId?: string | null): HomeScheduleFilter | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(homeScheduleStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HomeScheduleFilter>;
    return {
      ...emptyHomeSchedule(),
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      weekdays: Array.isArray(parsed.weekdays) ? parsed.weekdays : [],
      windowIds: Array.isArray(parsed.windowIds)
        ? parsed.windowIds.filter((id): id is HomeTimeWindowId =>
            HOME_TIME_WINDOWS.some((w) => w.id === id),
          )
        : [],
      hourFrom: typeof parsed.hourFrom === 'number' ? parsed.hourFrom : null,
      hourTo: typeof parsed.hourTo === 'number' ? parsed.hourTo : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredHomeSchedule(
  schedule: HomeScheduleFilter,
  userId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    if (!isScheduleFilterActive(schedule)) {
      window.localStorage.removeItem(homeScheduleStorageKey(userId));
      return;
    }
    window.localStorage.setItem(homeScheduleStorageKey(userId), JSON.stringify(schedule));
  } catch {
    /* quota / private mode */
  }
}
