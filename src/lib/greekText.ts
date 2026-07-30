const TONOS_STRIP: Record<string, string> = {
  Ά: 'Α',
  Έ: 'Ε',
  Ή: 'Η',
  Ί: 'Ι',
  Ό: 'Ο',
  Ύ: 'Υ',
  Ώ: 'Ω',
};

/**
 * Greek typographic convention: all-caps text drops the tonos (Ά→Α) but keeps
 * the diaeresis (Ϊ/Ϋ). Use for labels that are rendered in uppercase so Greek
 * copy follows standard orthography (e.g. «ΑΝΟΙΧΤΟ ΣΕ ΙΔΕΕΣ», not «ΑΝΟΙΧΤΌ ΣΕ ΙΔΈΕΣ»).
 */
export function toUpperNoAccents(text: string): string {
  return text
    .toUpperCase()
    .replace(/[ΆΈΉΊΌΎΏ]/g, (ch) => TONOS_STRIP[ch] ?? ch)
    .replace(/́/g, '');
}
