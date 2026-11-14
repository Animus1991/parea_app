/**
 * Live achievements (Φ25). Replaces hardcoded badge progress with values
 * derived from the user's real data, so every number on the Achievements,
 * Challenges and Leaderboard pages is true.
 */
import { addDays, format, getISOWeek, getISOWeekYear, parseISO, startOfWeek } from 'date-fns';
import type { Event, Group, User } from '../types';

export type AchievementId =
  | 'first_experience'
  | 'social_butterfly'
  | 'reliability_star'
  | 'weekly_streak'
  | 'trusted_member'
  | 'explorer'
  | 'trailblazer'
  | 'connector';

export interface LiveAchievement {
  id: AchievementId;
  titleEl: string;
  titleEn: string;
  descriptionEl: string;
  descriptionEn: string;
  progress: number;
  goal: number;
  unlocked: boolean;
  xp: number;
  /** Where the user can make progress. */
  path: string;
}

export interface AchievementInput {
  user: User;
  events: Event[];
  groups: Group[];
  feedbackEventIds: string[];
}

function maxConsecutiveWeeks(dates: string[]): number {
  const keys = [...new Set(
    dates
      .map((d) => {
        try {
          const dt = parseISO(d);
          return getISOWeekYear(dt) * 100 + getISOWeek(dt);
        } catch {
          return null;
        }
      })
      .filter((k): k is number => k !== null),
  )].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of keys) {
    // Week numbers wrap at year end (e.g. 202652 → 202701); treat as consecutive.
    const consecutive = prev !== null && (k - prev === 1 || (k % 100 === 1 && Math.floor(k / 100) - Math.floor(prev / 100) === 1));
    run = consecutive ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

export function computeAchievements({ user, events, groups, feedbackEventIds }: AchievementInput): LiveAchievement[] {
  const myGroups = groups.filter((g) => g.members.includes(user.id) && g.status !== 'cancelled');
  const myEventIds = new Set([...myGroups.map((g) => g.eventId), ...feedbackEventIds]);
  const myEvents = events.filter((e) => myEventIds.has(e.id));
  const categories = new Set(myEvents.map((e) => e.category));
  const verified = [user.emailVerified, user.phoneVerified, user.idVerified].filter(Boolean).length;
  const hostedFull = groups.filter((g) => g.hostId === user.id && g.members.length >= g.targetSize).length;
  const weeks = maxConsecutiveWeeks(myEvents.map((e) => e.date));
  const connections = (user.connections ?? []).length;

  const make = (
    id: AchievementId,
    goal: number,
    progress: number,
    xp: number,
    path: string,
    titleEl: string,
    titleEn: string,
    descriptionEl: string,
    descriptionEn: string,
  ): LiveAchievement => ({
    id,
    goal,
    progress: Math.min(progress, goal),
    unlocked: progress >= goal,
    xp,
    path,
    titleEl,
    titleEn,
    descriptionEl,
    descriptionEn,
  });

  return [
    make('first_experience', 1, feedbackEventIds.length > 0 ? 1 : myGroups.length > 0 ? 1 : 0, 50, '/', 'Πρώτη Εμπειρία', 'First Experience', 'Μπες στην πρώτη σου ομάδα', 'Join your first group'),
    make('social_butterfly', 5, myGroups.length, 100, '/', 'Κοινωνική Πεταλούδα', 'Social Butterfly', 'Γίνε μέλος σε 5 ομάδες', 'Join 5 groups'),
    make('reliability_star', 95, user.reliabilityScore ?? 0, 200, '/trust', 'Αστέρι Αξιοπιστίας', 'Reliability Star', 'Φτάσε 95% αξιοπιστία', 'Reach a 95% reliability score'),
    make('weekly_streak', 4, weeks, 150, '/agenda', 'Εβδομαδιαίο Σερί', 'Weekly Streak', 'Δραστηριότητα 4 εβδομάδες σερί', 'Be active 4 weeks in a row'),
    make('trusted_member', 3, verified, 75, '/verification', 'Αξιόπιστο Μέλος', 'Trusted Member', 'Επαλήθευσε email, τηλέφωνο και ταυτότητα', 'Verify email, phone and ID'),
    make('explorer', 4, categories.size, 120, '/categories', 'Εξερευνητής', 'Explorer', 'Δοκίμασε 4 διαφορετικές κατηγορίες', 'Try 4 different categories'),
    make('trailblazer', 1, hostedFull, 100, '/create', 'Πρωτοπόρος', 'Trailblazer', 'Οργάνωσε ομάδα που γέμισε', 'Host a group that fills up'),
    make('connector', 5, connections, 80, '/connections', 'Συνδετικός Κρίκος', 'Connector', 'Απόκτησε 5 Nakamas', 'Make 5 Nakamas connections'),
  ];
}

/** Mon→Sun activity of the current week (chat message sent, feedback given or challenge claimed). */
export function weeklyActivity(
  activityDates: string[],
  now: Date = new Date(),
): { days: boolean[]; streak: number } {
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const set = new Set(activityDates.map(localDay).filter(Boolean));
  const days = Array.from({ length: 7 }, (_, i) => set.has(format(addDays(monday, i), 'yyyy-MM-dd')));
  // Current streak: consecutive active days ending today (or yesterday).
  let streak = 0;
  let cursor = set.has(format(now, 'yyyy-MM-dd')) ? now : addDays(now, -1);
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return { days, streak };
}

export const DAILY_CHALLENGE_XP = 30;

/** Today's verifiable challenge: send at least one group message. */
export function dailyChallengeMet(messageDatesByMe: string[], now: Date = new Date()): boolean {
  const today = format(now, 'yyyy-MM-dd');
  return messageDatesByMe.some((d) => localDay(d) === today);
}

/** ISO timestamp or date → local yyyy-MM-dd (UTC timestamps near midnight land on the right day). */
export function localDay(value: string): string {
  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return value.slice(0, 10);
  }
}
