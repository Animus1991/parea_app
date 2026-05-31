import type { HomeRadiusFilter } from './homeFeedConstants';

/** Maps onboarding interest ids → Home feed category chips. */
export const ONBOARDING_INTEREST_TO_HOME_CATEGORY: Record<string, string> = {
  Theatre: 'Theater & Dance',
  Cinema: 'Cinema',
  Hiking: 'Hiking',
  Concerts: 'Live Music',
  'Board games': 'Board games',
  'Food & Drink': 'Food & Drink',
  Sports: 'Sports',
  Exhibitions: 'Exhibitions',
  'Tech Meetups': 'Networking',
  'Nearby escapes': 'Nearby escapes',
  'Wine Tasting': 'Food & Drink',
  'Escape Rooms': 'Social',
  Wellness: 'Wellness',
  'Language exchange': 'Language exchange',
  'Stand-up': 'Stand-up',
  Photography: 'Exhibitions',
};

export function mapOnboardingInterestToCategory(interestId: string): string | null {
  return ONBOARDING_INTEREST_TO_HOME_CATEGORY[interestId] ?? null;
}

export function mapOnboardingLocationToRadius(
  locationPref: string,
): HomeRadiusFilter {
  if (locationPref === 'local') return '10km';
  return 'Any';
}

export interface PostOnboardingHomeParams {
  interests: string[];
  locationPref: string;
}

/** Build Home URL with filters + welcome flag (additive; does not replace Home routing). */
export function buildPostOnboardingHomePath({
  interests,
  locationPref,
}: PostOnboardingHomeParams): string {
  const params = new URLSearchParams();
  params.set('welcome', '1');

  const primary = interests
    .map(mapOnboardingInterestToCategory)
    .find((c): c is string => !!c);
  if (primary) params.set('cat', primary);

  const dist = mapOnboardingLocationToRadius(locationPref);
  if (dist !== 'Any') params.set('dist', dist);

  return `/?${params.toString()}`;
}

export const ONBOARDING_WELCOME_SESSION_KEY = 'parea_onboarding_welcome';

export function markOnboardingWelcomeSession(): void {
  try {
    sessionStorage.setItem(ONBOARDING_WELCOME_SESSION_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeOnboardingWelcomeSession(): boolean {
  try {
    if (sessionStorage.getItem(ONBOARDING_WELCOME_SESSION_KEY) !== '1') return false;
    sessionStorage.removeItem(ONBOARDING_WELCOME_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}
