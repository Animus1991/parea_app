import { HOME_CATEGORIES } from './homeFeedConstants';

export function getHomeCategoryTranslations(
  t: (gr: string, en: string) => string,
): Record<string, string> {
  const map: Record<string, string> = {
    All: t('Όλα', 'All'),
    'Live Music': t('Ζωντανή μουσική', 'Live Music'),
    'Electronic Music': t('Ηλεκτρονική μουσική', 'Electronic Music'),
    'Theater & Dance': t('Θέατρο & χορός', 'Theater & Dance'),
    Cinema: t('Σινεμά', 'Cinema'),
    'Stand-up': 'Stand-up',
    'Food & Drink': t('Φαγητό & ποτό', 'Food & Drink'),
    Museums: t('Μουσεία', 'Museums'),
    Exhibitions: t('Εκθέσεις', 'Exhibitions'),
    Workshops: t('Εργαστήρια', 'Workshops'),
    Sports: t('Αθλητισμός', 'Sports'),
    Social: t('Κοινωνικά', 'Social'),
    Networking: t('Δικτύωση', 'Networking'),
    Wellness: t('Ευεξία', 'Wellness'),
    'Board games': t('Επιτραπέζια', 'Board Games'),
    'Book club': t('Λέσχη ανάγνωσης', 'Book Club'),
    'Language exchange': t('Ανταλλαγή γλωσσών', 'Language Exchange'),
    Hiking: t('Πεζοπορία', 'Hiking'),
    'Nearby escapes': t('Κοντινές αποδράσεις', 'Nearby Getaways'),
    'Walking tours': t('Ξεναγήσεις', 'Walking Tours'),
    'Community events': t('Κοινότητα', 'Community'),
  };
  for (const cat of HOME_CATEGORIES) {
    if (!map[cat]) map[cat] = cat;
  }
  return map;
}

export function getHomeTagTranslations(
  t: (gr: string, en: string) => string,
): Record<string, string> {
  return {
    All: t('Όλες οι ετικέτες', 'All Tags'),
    music: t('Μουσική', 'Music'),
    culture: t('Πολιτισμός', 'Culture'),
    food: t('Φαγητό', 'Food'),
    outdoor: t('Υπαίθρια', 'Outdoor'),
    social: t('Κοινωνικά', 'Social'),
    nightlife: t('Νυχτερινή ζωή', 'Nightlife'),
    sports: t('Αθλητισμός', 'Sports'),
    workshop: t('Εργαστήριο', 'Workshop'),
    free: t('Δωρεάν', 'Free'),
    cinema: t('Σινεμά', 'Cinema'),
    'open-air': t('Υπαίθριο', 'Open-air'),
    boardgames: t('Επιτραπέζια', 'Board games'),
    hiking: t('Πεζοπορία', 'Hiking'),
    nature: t('Φύση', 'Nature'),
    community: t('Κοινότητα', 'Community'),
    retro: t('Ρετρό', 'Retro'),
  };
}
