import type { User } from '../types';

type TFn = (gr: string, en: string) => string;

const GROUP_SIZE: Record<string, { gr: string; en: string }> = {
  tiny: { gr: '2–3 άτομα', en: '2–3 people' },
  small: { gr: '3–6 άτομα', en: '3–6 people' },
  medium: { gr: '6–10 άτομα', en: '6–10 people' },
  any: { gr: 'Χωρίς προτίμηση', en: 'No preference' },
};

const ACTIVITY: Record<string, { gr: string; en: string }> = {
  low: { gr: 'Χαλαρό ρυθμό', en: 'Relaxed pace' },
  medium: { gr: 'Μέτριο ρυθμό', en: 'Moderate pace' },
  high: { gr: 'Έντονη δραστηριότητα', en: 'Active pace' },
};

const SCHEDULE: Record<string, { gr: string; en: string }> = {
  weekends: { gr: 'Σαββατοκύριακα', en: 'Weekends' },
  weekday_eve: { gr: 'Βραδιές εργάσιμων', en: 'Weekday evenings' },
  flexible: { gr: 'Ελεύθερο πρόγραμμα', en: 'Flexible schedule' },
  mornings: { gr: 'Πρωινά', en: 'Mornings' },
};

const LOCATION: Record<string, { gr: string; en: string }> = {
  local: { gr: 'Κοντά μου', en: 'Near me' },
  city: { gr: 'Στην πόλη', en: 'In the city' },
  anywhere: { gr: 'Οπουδήποτε', en: 'Anywhere' },
};

export interface DiscoveryPrefChip {
  id: string;
  label: string;
}

/** Read-only chips for Home filter area (from onboarding discoveryPrefs). */
export function getDiscoveryPrefChips(
  user: User | null | undefined,
  t: TFn,
): DiscoveryPrefChip[] {
  const prefs = user?.discoveryPrefs;
  if (!prefs) return [];

  const chips: DiscoveryPrefChip[] = [];

  if (prefs.groupSize) {
    const m = GROUP_SIZE[prefs.groupSize];
    if (m) chips.push({ id: `gs-${prefs.groupSize}`, label: t(m.gr, m.en) });
  }
  if (prefs.activityLevel) {
    const m = ACTIVITY[prefs.activityLevel];
    if (m) chips.push({ id: `al-${prefs.activityLevel}`, label: t(m.gr, m.en) });
  }
  for (const slot of prefs.schedule ?? []) {
    const m = SCHEDULE[slot];
    if (m) chips.push({ id: `sc-${slot}`, label: t(m.gr, m.en) });
  }
  if (prefs.locationPref) {
    const m = LOCATION[prefs.locationPref];
    if (m) chips.push({ id: `loc-${prefs.locationPref}`, label: t(m.gr, m.en) });
  }

  return chips;
}
