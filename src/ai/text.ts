/**
 * Bilingual (Greek / English) text helpers for the Nakamas AI copilot.
 *
 * Everything the local engine matches goes through `normalize()` so that
 * «Σαββατοκύριακο», «σαββατοκυριακο» and «ΣΑΒΒΑΤΟΚΥΡΙΑΚΟ» are equal, and
 * `toLatin()` so that a Greek query («γκάζι») can match Latin data («Gazi»).
 */

/** Lowercase, strip diacritics (tonos, dialytika), unify final sigma, collapse spaces. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/[“”«»"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DIGRAPHS: [RegExp, string][] = [
  [/γκ/g, 'g'],
  [/γγ/g, 'ng'],
  [/μπ/g, 'b'],
  [/ντ/g, 'd'],
  [/τσ/g, 'ts'],
  [/τζ/g, 'tz'],
  [/ου/g, 'ou'],
  [/αι/g, 'e'],
  [/ει/g, 'i'],
  [/οι/g, 'i'],
];

const LETTERS: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k',
  λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'y',
  φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
};

/** Greeklish transliteration of an already-normalized string (approximate, for fuzzy matching). */
export function toLatin(normalized: string): string {
  let out = normalized;
  for (const [re, rep] of DIGRAPHS) out = out.replace(re, rep);
  return out.replace(/[α-ω]/g, (ch) => LETTERS[ch] ?? ch);
}

/** Loose comparison key: normalized + transliterated + vowels collapsed (i/y/e variants). */
export function fuzzyKey(input: string): string {
  return toLatin(normalize(input))
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/y/g, 'i')
    .replace(/h/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when any of the stems appears in the normalized text. Stems must be pre-normalized. */
export function hasAny(normalizedText: string, stems: readonly string[]): boolean {
  return stems.some((stem) => normalizedText.includes(stem));
}

/** Detects the dominant script of a message (used to answer in the user's language). */
export function detectLanguage(input: string, fallback: 'el' | 'en'): 'el' | 'en' {
  const greek = (input.match(/[Ͱ-Ͽἀ-῿]/g) ?? []).length;
  const latin = (input.match(/[a-zA-Z]/g) ?? []).length;
  if (greek === 0 && latin === 0) return fallback;
  return greek >= latin ? 'el' : 'en';
}

/** Removes leading command verbs so the remainder can be used as a free-text query. */
export function stripLeading(normalizedText: string, stems: readonly string[]): string {
  let out = normalizedText;
  for (const stem of stems) {
    if (out.startsWith(stem)) {
      out = out.slice(stem.length);
      break;
    }
  }
  return out.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}
