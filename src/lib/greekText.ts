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

/** Case- and accent-fold so «ΑΘΗΝΑ», «Αθήνα» and «αθηνα» match the same place. */
export function foldSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('el')
    .replace(/ς/g, 'σ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Articles, prepositions, conjunctions and possessives stay small inside a
 * title, as in both Greek and English title case («Εκδηλώσεις σε στιγμιότυπα»
 * reads «Εκδηλώσεις σε Στιγμιότυπα», never «… Σε …»).
 */
const SMALL_WORDS = new Set([
  'ο', 'η', 'το', 'οι', 'τα', 'του', 'της', 'των', 'τον', 'την', 'τους', 'τις',
  'στο', 'στη', 'στην', 'στον', 'στα', 'στις', 'στους', 'σε', 'με', 'και', 'κι', 'ή',
  'για', 'από', 'ως', 'προς', 'κατά', 'μετά', 'πριν', 'χωρίς', 'ανά', 'μου', 'σου', 'μας', 'σας',
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with', 'from', 'as', 'vs', 'per', 'via',
]);

/**
 * First letter of each word capital, the rest small. Short all-caps tokens
 * (AI, FAQ, SOS, GIPHY) stay as acronyms; small words stay small unless they
 * open the title or follow a colon.
 */
export function toTitleCase(text: string): string {
  let index = 0;
  let afterColon = false;
  return text.replace(/\S+/g, (word) => {
    const first = index === 0 || afterColon;
    index += 1;
    afterColon = word.endsWith(':');
    const letters = [...word].filter((ch) => LETTER.test(ch)).join('');
    const latinOnly = /^[A-Z]+$/.test(letters);
    if (latinOnly && letters.length >= 2 && letters.length <= 5) {
      return word;
    }
    const chars = [...word];
    const firstLetterIdx = chars.findIndex((ch) => LETTER.test(ch));
    if (firstLetterIdx < 0) return word;
    const small = !first && SMALL_WORDS.has(letters.toLocaleLowerCase());
    chars[firstLetterIdx] = small ? chars[firstLetterIdx].toLocaleLowerCase() : chars[firstLetterIdx].toLocaleUpperCase();
    for (let i = firstLetterIdx + 1; i < chars.length; i++) {
      if (LETTER.test(chars[i])) chars[i] = chars[i].toLocaleLowerCase();
    }
    return chars.join('');
  });
}
