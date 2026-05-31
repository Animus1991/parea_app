export function getDefaultHomeSearchSuggestions(
  t: (gr: string, en: string) => string,
): string[] {
  return [
    t('Πεζοπορία', 'Hiking'),
    t('Επιτραπέζια', 'Board Games'),
    t('Μουσικά Φεστιβάλ', 'Music Festivals'),
    t('Δικτύωση', 'Networking'),
    t('Συναυλίες', 'Concerts'),
    t('Σινεμά', 'Cinema'),
  ];
}
