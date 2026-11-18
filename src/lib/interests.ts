/**
 * Interests are stored by a stable English id (onboarding, profile, seed data).
 * This module turns an id into the label for the current language. Unknown
 * values (interests the user typed) are shown exactly as written.
 */
export interface InterestOption {
  id: string;
  gr: string;
  en: string;
  emoji: string;
}

/** Choices offered during onboarding. */
export const INTERESTS: readonly InterestOption[] = [
  { id: 'Theatre', gr: 'Θέατρο', en: 'Theatre', emoji: '🎭' },
  { id: 'Cinema', gr: 'Σινεμά', en: 'Cinema', emoji: '🎬' },
  { id: 'Hiking', gr: 'Πεζοπορία', en: 'Hiking', emoji: '🥾' },
  { id: 'Concerts', gr: 'Συναυλίες', en: 'Concerts', emoji: '🎵' },
  { id: 'Board games', gr: 'Επιτραπέζια', en: 'Board Games', emoji: '🎲' },
  { id: 'Food & Drink', gr: 'Γαστρονομία', en: 'Food & Dining', emoji: '🍽️' },
  { id: 'Sports', gr: 'Αθλητισμός', en: 'Sports', emoji: '⚽' },
  { id: 'Exhibitions', gr: 'Εκθέσεις / Τέχνη', en: 'Art & Exhibitions', emoji: '🖼️' },
  { id: 'Tech Meetups', gr: 'Τεχνολογία', en: 'Tech Meetups', emoji: '💻' },
  { id: 'Nearby escapes', gr: 'Εκδρομές', en: 'Day Trips', emoji: '🚌' },
  { id: 'Wine Tasting', gr: 'Γευσιγνωσία κρασιού', en: 'Wine Tasting', emoji: '🍷' },
  { id: 'Escape Rooms', gr: 'Δωμάτια απόδρασης', en: 'Escape Rooms', emoji: '🔐' },
  { id: 'Wellness', gr: 'Ευεξία & Yoga', en: 'Wellness & Yoga', emoji: '🧘' },
  { id: 'Language exchange', gr: 'Ανταλλαγή Γλωσσών', en: 'Language Exchange', emoji: '🌐' },
  { id: 'Stand-up', gr: 'Stand-up Comedy', en: 'Stand-up Comedy', emoji: '🎤' },
  { id: 'Photography', gr: 'Φωτογραφία', en: 'Photography', emoji: '📷' },
];

/** Values found in existing profiles and seed data that are not onboarding choices. */
const EXTRA_LABELS: Record<string, { gr: string; en: string }> = {
  'live music': { gr: 'Ζωντανή μουσική', en: 'Live Music' },
  festivals: { gr: 'Φεστιβάλ', en: 'Festivals' },
  social: { gr: 'Κοινωνικές έξοδοι', en: 'Social' },
};

const norm = (value: string) => value.trim().toLowerCase();

const LABELS = new Map<string, { id: string; gr: string; en: string }>();
for (const item of INTERESTS) {
  for (const key of [item.id, item.en, item.gr]) LABELS.set(norm(key), item);
}
for (const [key, label] of Object.entries(EXTRA_LABELS)) {
  const entry = { id: label.en, ...label };
  for (const k of [key, label.gr]) LABELS.set(norm(k), entry);
}

/** Label of an interest in the given language; values we do not know stay as typed. */
export function interestLabel(value: string, language: string): string {
  const hit = LABELS.get(norm(value));
  if (!hit) return value;
  return language === 'el' ? hit.gr : hit.en;
}

/**
 * The value to store for an interest the user typed: the shared id when it is
 * a known interest in either language (so «Θέατρο» and «Theatre» match other
 * people's profiles), otherwise the text as typed.
 */
export function canonicalInterest(value: string): string {
  const hit = LABELS.get(norm(value));
  return hit ? hit.id : value.trim();
}

/** True when two stored or typed values mean the same interest. */
export function sameInterest(a: string, b: string): boolean {
  return norm(canonicalInterest(a)) === norm(canonicalInterest(b));
}
