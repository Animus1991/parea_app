import { ONBOARDING_INTEREST_TO_HOME_CATEGORY } from './onboardingHomeBridge';
import type { Event, User } from '../types';

const HIGH_ACTIVITY_CATEGORIES = new Set(['Sports', 'Hiking', 'Nearby escapes']);
const LOW_ACTIVITY_CATEGORIES = new Set([
  'Cinema',
  'Theater & Dance',
  'Board games',
  'Food & Drink',
  'Exhibitions',
]);

/** Whether an event aligns with onboarding interests or mapped categories. */
export function eventMatchesUserInterest(event: Event, user: User | null): boolean {
  if (!user) return false;
  const interests = user.interests ?? [];
  if (interests.length === 0) return false;

  if (interests.includes(event.category)) return true;
  if ((event.tags ?? []).some((tag) => interests.includes(tag))) return true;

  return interests.some(
    (id) => ONBOARDING_INTEREST_TO_HOME_CATEGORY[id] === event.category,
  );
}

/** Relevance boost for «Για Σένα» sorting (additive with existing sort). */
export function getEventPersonalizationScore(event: Event, user: User | null): number {
  if (!user) return 0;

  let score = 0;
  const interests = user.interests ?? [];

  for (const id of interests) {
    if (ONBOARDING_INTEREST_TO_HOME_CATEGORY[id] === event.category) score += 28;
  }
  if (interests.includes(event.category)) score += 35;

  const tagHits = (event.tags ?? []).filter((tag) => interests.includes(tag)).length;
  score += tagHits * 18;

  const prefs = user.discoveryPrefs;
  if (prefs?.activityLevel === 'high' && HIGH_ACTIVITY_CATEGORIES.has(event.category)) {
    score += 12;
  }
  if (prefs?.activityLevel === 'low' && LOW_ACTIVITY_CATEGORIES.has(event.category)) {
    score += 12;
  }
  if (prefs?.activityLevel === 'medium') score += 4;

  if (prefs?.schedule?.includes('weekends')) {
    const d = new Date(`${event.date}T12:00:00`);
    const day = d.getDay();
    if (day === 0 || day === 6) score += 6;
  }

  return score;
}
