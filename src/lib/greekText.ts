const TONOS_STRIP: Record<string, string> = {
  Ά: 'Α',
  Έ: 'Ε',
  Ή: 'Η',
  Ί: 'Ι',
  Ό: 'Ο',
  Ύ: 'Υ',
  Ώ: 'Ω',
};

const LETTER = /[A-Za-zÀ-ÿΑ-Ωα-ωΆΈΉΊΌΎΏάέήίόύώΪΫϊϋΐΰ]/;

/**
 * Greek typographic convention: all-caps text drops the tonos (Ά→Α) but keeps
 * the diaeresis (Ϊ/Ϋ). Kept for rare glyphs; titles and section labels now use
 * {@link toTitleCase} instead of shouting.
 */
export function toUpperNoAccents(text: string): string {
  return text
    .toUpperCase()
    .replace(/[ΆΈΉΊΌΎΏ]/g, (ch) => TONOS_STRIP[ch] ?? ch)
    .replace(/́/g, '');
}

/**
 * First letter of each word capital, the rest small. Short all-caps tokens
 * (AI, FAQ, SOS, GIPHY) stay as acronyms.
 */
export function toTitleCase(text: string): string {
  return text.replace(/\S+/g, (word) => {
    const letters = [...word].filter((ch) => LETTER.test(ch)).join('');
    const latinOnly = /^[A-Z]+$/.test(letters);
    if (latinOnly && letters.length >= 2 && letters.length <= 5) {
      return word;
    }
    const chars = [...word];
    const firstLetterIdx = chars.findIndex((ch) => LETTER.test(ch));
    if (firstLetterIdx < 0) return word;
    chars[firstLetterIdx] = chars[firstLetterIdx].toLocaleUpperCase();
    for (let i = firstLetterIdx + 1; i < chars.length; i++) {
      if (LETTER.test(chars[i])) chars[i] = chars[i].toLocaleLowerCase();
    }
    return chars.join('');
  });
}
